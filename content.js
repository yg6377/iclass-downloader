// 감지된 파일 목록
let detectedFiles = [];

// 페이지 URL 추적은 제거 (수동 초기화로 변경)

// 다운로드 버튼 UI 생성
function createDownloadButton() {
  // 이미 버튼이 있으면 생성하지 않음
  if (document.getElementById('iclass-downloader-btn')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'iclass-downloader-btn';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const button = document.createElement('button');
  button.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 15px 25px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  button.innerHTML = '📥 자료 다운로드 (0)';
  
  // 호버 효과
  button.onmouseenter = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  };
  button.onmouseleave = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  };

  // 클릭 시 파일 목록 모달 표시
  button.onclick = showFileListModal;

  container.appendChild(button);
  document.body.appendChild(container);

  return button;
}

// 파일 목록 모달 표시
function showFileListModal() {
  // 기존 모달이 있으면 제거
  const existingModal = document.getElementById('iclass-downloader-modal');
  if (existingModal) {
    existingModal.remove();
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'iclass-downloader-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 30px;
    max-width: 600px;
    max-height: 70vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  `;

  const title = document.createElement('h2');
  title.textContent = '감지된 강의 자료';
  title.style.cssText = `
    margin: 0;
    color: #333;
    font-size: 24px;
  `;

  const buttonGroup = document.createElement('div');
  buttonGroup.style.cssText = `
    display: flex;
    gap: 10px;
  `;

  // 전체 다운로드 버튼
  if (detectedFiles.length > 0) {
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.textContent = '📦 전체 다운로드';
    downloadAllBtn.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      transition: transform 0.2s;
    `;
    downloadAllBtn.onmouseenter = () => {
      downloadAllBtn.style.transform = 'scale(1.05)';
    };
    downloadAllBtn.onmouseleave = () => {
      downloadAllBtn.style.transform = 'scale(1)';
    };
    downloadAllBtn.onclick = () => downloadAllFiles(downloadAllBtn);
    buttonGroup.appendChild(downloadAllBtn);
  }

  // 목록 초기화 버튼
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '🗑️ 목록 초기화';
  clearBtn.style.cssText = `
    background: #ff6b6b;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: bold;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.2s;
  `;
  clearBtn.onmouseenter = () => {
    clearBtn.style.transform = 'scale(1.05)';
  };
  clearBtn.onmouseleave = () => {
    clearBtn.style.transform = 'scale(1)';
  };
  clearBtn.onclick = () => {
    if (confirm('감지된 파일 목록을 모두 초기화하시겠습니까?')) {
      clearAllFiles();
      modal.remove();
    }
  };

  buttonGroup.appendChild(clearBtn);
  header.appendChild(title);
  header.appendChild(buttonGroup);

  const fileList = document.createElement('div');
  
  if (detectedFiles.length === 0) {
    fileList.innerHTML = `
      <p style="color: #666; text-align: center; padding: 40px 20px;">
        아직 감지된 파일이 없습니다.<br>
        강의 자료를 열람하거나 재생해주세요.
      </p>
    `;
  } else {
    detectedFiles.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.style.cssText = `
        background: #f5f5f5;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.2s;
      `;
      
      fileItem.onmouseenter = () => {
        fileItem.style.background = '#e8e8e8';
      };
      fileItem.onmouseleave = () => {
        fileItem.style.background = '#f5f5f5';
      };

      const fileInfo = document.createElement('div');
      const typeEmoji = {
        'video': '🎥',
        'pdf': '📄',
        'presentation': '📊',
        'audio': '🎵',
        'file': '📎'
      };
      
      // 파일 크기를 읽기 쉽게 변환
      const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      };
      
      // 파일명 표시 (없으면 "파일 N"으로 표시)
      const displayName = file.filename || `${file.type.toUpperCase()} 파일 ${index + 1}`;
      
      fileInfo.innerHTML = `
        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
          ${typeEmoji[file.type] || '📎'} ${displayName}
        </div>
        <div style="font-size: 12px; color: #666;">
          ${formatFileSize(file.size)}
        </div>
      `;

      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = '다운로드';
      downloadBtn.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      
      downloadBtn.onmouseenter = () => {
        downloadBtn.style.transform = 'scale(1.05)';
      };
      downloadBtn.onmouseleave = () => {
        downloadBtn.style.transform = 'scale(1)';
      };

      downloadBtn.onclick = () => downloadFile(file, downloadBtn);

      fileItem.appendChild(fileInfo);
      fileItem.appendChild(downloadBtn);
      fileList.appendChild(fileItem);
    });
  }

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '닫기';
  closeBtn.style.cssText = `
    width: 100%;
    margin-top: 20px;
    padding: 12px;
    background: #e0e0e0;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  `;
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = '#d0d0d0';
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = '#e0e0e0';
  };
  closeBtn.onclick = () => modal.remove();

  modalContent.appendChild(header);
  modalContent.appendChild(fileList);
  modalContent.appendChild(closeBtn);
  modal.appendChild(modalContent);

  // 모달 외부 클릭시 닫기
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };

  document.body.appendChild(modal);
}

// 목록 초기화
function clearAllFiles() {
  detectedFiles = [];
  updateButtonCount();
  
  // background script에도 초기화 요청
  chrome.runtime.sendMessage({ 
    action: 'clearFiles'
  });
}

// 전체 다운로드
function downloadAllFiles(button) {
  if (detectedFiles.length === 0) return;
  
  const originalText = button.textContent;
  button.textContent = '⏳ 다운로드 중...';
  button.disabled = true;
  
  let completed = 0;
  const total = detectedFiles.length;
  
  // 파일들을 순차적으로 다운로드 (동시 다운로드는 브라우저가 제한할 수 있음)
  const downloadNext = (index) => {
    if (index >= total) {
      button.textContent = '✓ 완료!';
      button.style.background = '#4caf50';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        button.disabled = false;
      }, 2000);
      return;
    }
    
    const file = detectedFiles[index];
    let filename;
    if (file.filename) {
      filename = file.filename;
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      filename = `iClass_${file.type}_${timestamp}${file.extension}`;
    }
    
    chrome.runtime.sendMessage({
      action: 'downloadFile',
      url: file.url,
      filename: filename
    }, (response) => {
      completed++;
      button.textContent = `⏳ 다운로드 중... (${completed}/${total})`;
      
      // 다음 파일 다운로드 (500ms 딜레이)
      setTimeout(() => downloadNext(index + 1), 500);
    });
  };
  
  downloadNext(0);
}

// 파일 다운로드
function downloadFile(file, button) {
  const originalText = button.textContent;
  button.textContent = '다운로드 중...';
  button.disabled = true;

  // 파일명 생성 - 원본 파일명이 있으면 사용, 없으면 타임스탬프 생성
  let filename;
  if (file.filename) {
    filename = file.filename;
  } else {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    filename = `iClass_${file.type}_${timestamp}${file.extension}`;
  }

  chrome.runtime.sendMessage({
    action: 'downloadFile',
    url: file.url,
    filename: filename
  }, (response) => {
    if (response && response.success) {
      button.textContent = '✓ 완료';
      button.style.background = '#4caf50';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        button.disabled = false;
      }, 2000);
    } else {
      button.textContent = '✗ 실패';
      button.style.background = '#f44336';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        button.disabled = false;
      }, 2000);
    }
  });
}

// 버튼 카운트 업데이트
function updateButtonCount() {
  const button = document.getElementById('iclass-downloader-btn');
  if (button) {
    const btn = button.querySelector('button');
    if (btn) {
      btn.innerHTML = `📥 자료 다운로드 (${detectedFiles.length})`;
    }
  }
}

// background script로부터 파일 감지 메시지 받기
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fileDetected') {
    detectedFiles.push(request.file);
    updateButtonCount();
    
    // 처음 파일이 감지되면 버튼 생성
    if (detectedFiles.length === 1) {
      createDownloadButton();
    }
  }
});

// 페이지 로드 완료 후 버튼 생성 및 기존 파일 확인
function initialize() {
  // 강의 자료 페이지인지 확인
  if (window.location.href.includes('iclass.tku.edu.tw')) {
    createDownloadButton();
    
    // 이미 감지된 파일이 있는지 확인
    chrome.runtime.sendMessage({ action: 'getDetectedFiles' }, (response) => {
      if (response && response.files) {
        detectedFiles = response.files;
        updateButtonCount();
      }
    });
  }
}

// 페이지가 완전히 로드된 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// SPA 페이지 변경 감지 (iClass는 React 앱이므로)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    initialize();
  }
}).observe(document, { subtree: true, childList: true });