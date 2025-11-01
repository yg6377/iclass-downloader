// 감지된 파일들을 저장
const detectedFiles = new Map();

// 네트워크 응답 헤더 확인하여 파일 크기 체크
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const url = details.url;
    
    // 로고나 아이콘 등 작은 이미지 파일 제외
    if (url.includes('/logo') || url.includes('/icon') || 
        url.includes('iclass-logo') || url.includes('thumbnail')) {
      return;
    }
    
    // tc-minio 서버의 미디어 파일 감지
    if (url.includes('tc-minio.tku.edu.tw/lms-media/')) {
      // Content-Length 헤더로 파일 크기 확인
      const contentLength = details.responseHeaders?.find(
        h => h.name.toLowerCase() === 'content-length'
      )?.value;
      
      const fileSize = contentLength ? parseInt(contentLength) : 0;
      
      // 100KB 이하의 파일은 무시 (로고, 아이콘 등)
      if (fileSize < 100 * 1024) {
        return;
      }
      // 파일 타입 추출
      let fileType = 'file';
      let extension = '';
      
      // URL 또는 Content-Disposition에서 파일 타입 판단
      if (url.includes('.mp4') || url.includes('outbound/')) {
        fileType = 'video';
        extension = '.mp4';
      } else if (url.includes('.pdf') || url.includes('file-storage/')) {
        fileType = 'pdf';
        extension = '.pdf';
      } else if (url.includes('.ppt') || url.includes('.pptx')) {
        fileType = 'presentation';
        extension = url.includes('.pptx') ? '.pptx' : '.ppt';
      } else if (url.includes('.mp3')) {
        fileType = 'audio';
        extension = '.mp3';
      }
      
      // file-storage 경로면 Content-Disposition에서 파일명 추출 시도
      let filename = '';
      if (url.includes('file-storage/') && url.includes('filename')) {
        const match = url.match(/filename[*]?=UTF-8''([^&]+)|filename[*]?="?([^"&]+)"?/);
        if (match) {
          filename = decodeURIComponent(match[1] || match[2] || '');
          if (filename.includes('.pdf')) {
            fileType = 'pdf';
            extension = '.pdf';
          } else if (filename.includes('.ppt')) {
            fileType = 'presentation';
            extension = filename.includes('.pptx') ? '.pptx' : '.ppt';
          }
        }
      }
      
      // outbound 경로면 URL에서 파일명 추출
      if (url.includes('outbound/') && !filename) {
        const urlMatch = url.match(/\/([^/?]+\.mp4)/);
        if (urlMatch) {
          filename = urlMatch[1];
        }
      }
      
      // 파일 정보 저장
      const fileInfo = {
        url: url,
        type: fileType,
        extension: extension,
        size: fileSize,
        filename: filename,
        timestamp: Date.now(),
        tabId: details.tabId
      };
      
      // 해당 탭의 파일 목록에 추가
      if (!detectedFiles.has(details.tabId)) {
        detectedFiles.set(details.tabId, []);
      }
      
      const tabFiles = detectedFiles.get(details.tabId);
      // 중복 체크 (같은 URL은 추가하지 않음)
      const exists = tabFiles.some(f => f.url === url);
      if (!exists) {
        tabFiles.push(fileInfo);
        
        // content script에 알림
        chrome.tabs.sendMessage(details.tabId, {
          action: 'fileDetected',
          file: fileInfo
        }).catch(() => {
          // 탭이 아직 준비되지 않은 경우 무시
        });
      }
    }
  },
  { urls: ["https://tc-minio.tku.edu.tw/*"] },
  ["responseHeaders"]
);

// content script로부터 다운로드 요청 받기
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDetectedFiles') {
    const files = detectedFiles.get(sender.tab.id) || [];
    sendResponse({ files: files });
  } else if (request.action === 'clearFiles') {
    // 해당 탭의 파일 목록 초기화
    if (sender.tab && sender.tab.id) {
      detectedFiles.delete(sender.tab.id);
    }
    sendResponse({ success: true });
  } else if (request.action === 'downloadFile') {
    // 파일 다운로드
    const { url, filename } = request;
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false  // 자동 저장으로 변경하여 확장자 보존
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    
    return true; // 비동기 응답을 위해 true 반환
  }
});

// 탭이 닫히면 해당 탭의 파일 목록 삭제
chrome.tabs.onRemoved.addListener((tabId) => {
  detectedFiles.delete(tabId);
});