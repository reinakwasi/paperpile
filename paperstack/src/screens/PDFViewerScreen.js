import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const PDFViewerScreen = ({ navigation, route }) => {
  const { uri, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const webViewRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        
        if (uri.startsWith('file://') || uri.startsWith(FileSystem.documentDirectory)) {
          if (!fileInfo.exists) {
            setError('PDF file not found');
            return;
          }
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setPdfBase64(base64);
        } else {
          const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;
          
          const downloadResumable = FileSystem.createDownloadResumable(
            uri,
            fileUri
          );

          const { uri: localUri } = await downloadResumable.downloadAsync();
          const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setPdfBase64(base64);
        }
      } catch (error) {
        setError('Failed to load PDF: ' + error.message);
      }
    };

    loadPDF();
  }, [uri, title]);

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description);
    setLoading(false);
  };

  const handleMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'pageChange') {
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
    } else if (data.type === 'zoomChange') {
      setZoomLevel(Math.round(data.zoom * 100));
    }
  };

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript(`
      window.zoomIn();
      true;
    `);
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript(`
      window.zoomOut();
      true;
    `);
  };

  const handleDownload = async () => {
    try {
      let fileUri;

      if (uri.startsWith('file://') || uri.startsWith(FileSystem.documentDirectory)) {
        fileUri = uri;
      } else {
        const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
        fileUri = `${FileSystem.documentDirectory}${fileName}`;

        const downloadResumable = FileSystem.createDownloadResumable(uri, fileUri);
        const { uri: localUri } = await downloadResumable.downloadAsync();
        fileUri = localUri;
      }

      if (Platform.OS === 'android') {
        // Use Storage Access Framework for Android
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          const fileName = title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf` : 'document.pdf';
          const directoryUri = permissions.directoryUri;
          
          // Read the downloaded file's content
          const fileContentBase64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
          
          // Create file in the selected directory and write the content
          await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri,
            fileName,
            'application/pdf'
          ).then(async (newUri) => {
            await FileSystem.writeAsStringAsync(newUri, fileContentBase64, { encoding: FileSystem.EncodingType.Base64 });
            Alert.alert('Done', 'Your PDF is ready and has been saved to your device');
          });
        } else {
           Alert.alert('Permission Required', 'Please grant permission to access storage to save the PDF.');
        }
      } else {
        // For iOS, use Sharing
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save PDF',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Sharing not available on this device');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save PDF: ' + error.message);
    }
  };

  const createPDFViewerHTML = (pdfUri, base64Data) => {
    const pdfData = base64Data ? `data:application/pdf;base64,${base64Data}` : pdfUri;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              background-color: #525659; 
              width: 100vw; 
              height: 100vh; 
              overflow: hidden;
            }
            #viewerContainer { 
              position: absolute; 
              top: 0; 
              left: 0; 
              right: 0; 
              bottom: 0; 
              overflow: auto; 
              background-color: #525659;
              -webkit-overflow-scrolling: touch;
            }
            #viewer { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              padding: 10px 0; 
              min-height: 100%;
            }
            .page { 
              margin: 10px 0; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.3); 
              transform-origin: top center;
              transition: transform 0.2s ease, width 0.2s ease, height 0.2s ease;
            }
            .page canvas { 
              display: block; 
              background-color: white; 
              width: 100%;
              height: 100%;
            }
            #loadingContainer { 
              position: fixed; 
              top: 0; 
              left: 0; 
              right: 0; 
              bottom: 0; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              background-color: rgba(0,0,0,0.5); 
              color: white; 
              z-index: 1000;
            }
            .error-message { 
              position: fixed; 
              top: 0; 
              left: 0; 
              right: 0; 
              bottom: 0; 
              display: flex; 
              flex-direction: column; 
              justify-content: center; 
              align-items: center; 
              color: white; 
              background-color: #525659; 
              z-index: 1000;
            }
          </style>
        </head>
        <body>
          <div id="viewerContainer">
            <div id="viewer"></div>
          </div>
          <div id="loadingContainer">Loading PDF...</div>
          
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            let pdfDoc = null;
            let currentPage = 1;
            let totalPages = 0;
            let currentScale = 1.0;
            let isPinching = false;
            let startDistance = 0;
            let startScale = 1.0;
            let lastTouchEnd = 0;
            
            const MIN_SCALE = 0.5;
            const MAX_SCALE = 3.0;
            const ZOOM_STEP = 0.25;
            const DOUBLE_TAP_DELAY = 300;
            
            const viewerContainer = document.getElementById('viewerContainer');
            const viewer = document.getElementById('viewer');
            const loadingContainer = document.getElementById('loadingContainer');
            
            // Store original dimensions for each page
            const pageOriginalDimensions = {};
            
            async function initPDFViewer() {
              try {
                const loadingTask = pdfjsLib.getDocument('${pdfData}');
                pdfDoc = await loadingTask.promise;
                totalPages = pdfDoc.numPages;
                
                setupEventListeners();
                await renderAllPages();
                loadingContainer.style.display = 'none';
                
                updatePageInfo();
              } catch (error) {
                showError('Error loading PDF: ' + error.message);
              }
            }
            
            async function renderAllPages() {
              viewer.innerHTML = '';
              
              for (let i = 1; i <= totalPages; i++) {
                await renderPage(i);
              }
              
              updatePageInfo();
            }
            
            async function renderPage(pageNumber) {
              const page = await pdfDoc.getPage(pageNumber);
              const viewport = page.getViewport({ scale: currentScale });
              
              // Store original dimensions
              const originalViewport = page.getViewport({ scale: 1.0 });
              pageOriginalDimensions[pageNumber] = {
                width: originalViewport.width,
                height: originalViewport.height
              };
              
              const pageDiv = document.createElement('div');
              pageDiv.className = 'page';
              pageDiv.dataset.pageNumber = pageNumber;
              pageDiv.style.width = viewport.width + 'px';
              pageDiv.style.height = viewport.height + 'px';
              
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              const context = canvas.getContext('2d', { alpha: false });
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              
              pageDiv.appendChild(canvas);
              viewer.appendChild(pageDiv);
            }
            
            function updatePageInfo() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'pageChange',
                page: currentPage,
                totalPages: totalPages,
                zoom: currentScale
              }));
            }
            
            function handleScroll() {
              const scrollTop = viewerContainer.scrollTop;
              const viewerHeight = viewerContainer.clientHeight;
              const viewerCenter = scrollTop + (viewerHeight / 2);
              
              let closestPage = 1;
              let minDistance = Infinity;
              
              const pages = document.getElementsByClassName('page');
              for (let i = 0; i < pages.length; i++) {
                const pageRect = pages[i].getBoundingClientRect();
                const pageCenter = pageRect.top + (pageRect.height / 2) + scrollTop;
                const distance = Math.abs(pageCenter - viewerCenter);
                
                if (distance < minDistance) {
                  minDistance = distance;
                  closestPage = i + 1;
                }
              }
              
              if (currentPage !== closestPage) {
                currentPage = closestPage;
                updatePageInfo();
              }
            }
            
            function handleTouchStart(e) {
              if (e.touches.length === 2) {
                e.preventDefault();
                isPinching = true;
                startDistance = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                startScale = currentScale;
              }
            }
            
            function handleTouchMove(e) {
              if (isPinching && e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                const scale = (currentDistance / startDistance) * startScale;
                setZoomLevel(scale);
              }
            }
            
            function handleTouchEnd() {
              isPinching = false;
            }
            
            function handleDoubleTap(x, y) {
              const newScale = currentScale === 1.0 ? 2.0 : 1.0;
              setZoomLevel(newScale);
              
              // Center the zoom on the tap position
              const scrollX = x * newScale - viewerContainer.clientWidth / 2;
              const scrollY = y * newScale - viewerContainer.clientHeight / 2;
              
              viewerContainer.scrollTo({
                left: Math.max(0, scrollX),
                top: Math.max(0, scrollY),
                behavior: 'smooth'
              });
            }
            
            function setZoomLevel(newScale) {
              newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
              if (newScale !== currentScale) {
                const scaleRatio = newScale / currentScale;
                currentScale = newScale;
                
                // Scale existing pages instead of re-rendering
                const pages = document.getElementsByClassName('page');
                for (let i = 0; i < pages.length; i++) {
                  const page = pages[i];
                  const pageNumber = parseInt(page.dataset.pageNumber);
                  const originalWidth = pageOriginalDimensions[pageNumber].width;
                  const originalHeight = pageOriginalDimensions[pageNumber].height;
                  
                  page.style.width = (originalWidth * currentScale) + 'px';
                  page.style.height = (originalHeight * currentScale) + 'px';
                  
                  const canvas = page.querySelector('canvas');
                  if (canvas) {
                    canvas.style.width = (originalWidth * currentScale) + 'px';
                    canvas.style.height = (originalHeight * currentScale) + 'px';
                  }
                }
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'zoomChange',
                  zoom: currentScale
                }));
              }
            }
            
            function showError(message) {
              viewer.innerHTML = '<div class="error-message">' + message + '</div>';
              loadingContainer.style.display = 'none';
            }
            
            function setupEventListeners() {
              viewerContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
              viewerContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
              viewerContainer.addEventListener('touchend', handleTouchEnd);
              viewerContainer.addEventListener('scroll', handleScroll);
              
              // Add double-tap detection
              let lastTap = 0;
              viewerContainer.addEventListener('touchend', (e) => {
                if (e.touches && e.touches.length > 0) return;
                
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                  // Double-tap detected
                  const tapX = e.changedTouches[0].pageX;
                  const tapY = e.changedTouches[0].pageY;
                  handleDoubleTap(tapX, tapY);
                }
                lastTap = currentTime;
              });
            }
            
            // Expose zoom functions to React Native
            window.zoomIn = function() {
              setZoomLevel(currentScale + ZOOM_STEP);
            };
            
            window.zoomOut = function() {
              setZoomLevel(currentScale - ZOOM_STEP);
            };
            
            initPDFViewer();
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        
        <View style={styles.controls}>
          <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
          <View style={styles.zoomControls}>
            <TouchableOpacity onPress={handleZoomOut} style={styles.zoomButton}>
              <Ionicons name="remove" size={20} color="#222" />
            </TouchableOpacity>
            <Text style={styles.zoomText}>{zoomLevel}%</Text>
            <TouchableOpacity onPress={handleZoomIn} style={styles.zoomButton}>
              <Ionicons name="add" size={20} color="#222" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity onPress={handleDownload} style={styles.headerButton}>
          <Ionicons name="download-outline" size={24} color="#222" />
        </TouchableOpacity>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f5ef7" />
        </View>
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: createPDFViewerHTML(uri, pdfBase64) }}
          style={styles.webview}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={false}
          originWhitelist={['*']}
          mixedContentMode="always"
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          scrollEnabled={true}
          bounces={false}
          overScrollMode="never"
          androidLayerType="hardware"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageInfo: {
    marginRight: 20,
    fontSize: 16,
    color: '#222',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  zoomButton: {
    padding: 4,
  },
  zoomText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#222',
    minWidth: 40,
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: '#525659',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#525659',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#525659',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    color: '#4f5ef7',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PDFViewerScreen;