/**
 * Requests user permission for microphone access.
 * @returns {Promise<void>} A Promise that resolves when permission is granted or rejects with an error.
 */
async function getUserPermission() {
  return new Promise((resolve, reject) => {
    // Using navigator.mediaDevices.getUserMedia to request microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(async (stream) => {
        // Permission granted, handle the stream if needed
        const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.label);
        const microphoneDevices = [];
        devices.forEach((device) => {
          if (device.kind == "audioinput") {
            microphoneDevices.push({ label: device.label, value: device.label});
          }
        });
        resolve(microphoneDevices);
      })
      .catch((error) => {
        // Handling different error scenarios
        if (error.name === "Permission denied") {
          reject("MICROPHONE_PERMISSION_DENIED");
        } else {
          reject(error);
        }
      });
  });
}

// Call the function to request microphone permission
getUserPermission()
.then((microphoneDevices) => {
  try {
    chrome.runtime.sendMessage({action: "MICROPHONE_DEVICE_PERMISSION_GRANTED", data:{microphoneDevices}});
  } catch (e) {}
})
.catch(error => {
  try {
    chrome.runtime.sendMessage({action: "MICROPHONE_DEVICE_PERMISSION_DENIED"});
  } catch (e) {}
});