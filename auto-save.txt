const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

//nodemon --legacy-watch api.js - xoá cache nodemon
//npm install -g nodemon - update new version of nodemon

const appScript = path.join(__dirname, 'api.js'); // Tệp chính của ứng dụng
const restartInterval = 60000; // Khoảng thời gian khởi động lại (10 giây)
const saveInterval = 60000; // Khoảng thời gian để tự động lưu tệp (10 giây)
const stopDelay = 0; // Thời gian đợi trước khi khởi động lại (3 giây)

let childProcess;

// Định nghĩa hàm lưu tệp
const saveFile = (filePath) => {
  console.log(`Simulating file save: ${filePath}`);
  fs.utimes(filePath, new Date(), new Date(), (err) => {
    if (err) {
      console.error(`Error saving file ${filePath}:`, err);
    }
  });
};

// Định nghĩa hàm khởi động lại ứng dụng
const runApp = () => {
  if (childProcess) {
    console.log('Stopping existing application...');
    childProcess.kill('SIGTERM');

    // Đợi trước khi khởi động lại ứng dụng
    setTimeout(() => {
      console.log('Starting application...');
      childProcess = spawn('node', [appScript], {
        stdio: 'inherit'
      });

      childProcess.on('error', (err) => {
        console.error(`Failed to start process: ${err.message}`);
      });

      childProcess.on('exit', (code) => {
        console.log(`Application exited with code ${code}`);
      });
    }, stopDelay);
  } else {
    console.log('Starting application...');
    childProcess = spawn('node', [appScript], {
      stdio: 'inherit'
    });

    childProcess.on('error', (err) => {
      console.error(`Failed to start process: ${err.message}`);
    });

    childProcess.on('exit', (code) => {
      console.log(`Application exited with code ${code}`);
    });
  }
};

// Khởi động lại ứng dụng lần đầu tiên và sau mỗi khoảng thời gian định kỳ
runApp(); // Khởi động ứng dụng ngay lập tức
setInterval(() => {
  saveFile(appScript); // Simulate file save
  runApp(); // Restart the application
}, restartInterval);
