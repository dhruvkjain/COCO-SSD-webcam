const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');

let model = false;
let children = []; // contains HTML children elements(bounding boxes) 
// that we will draw around object
// these elements are deleted for every frame and then re rendered.

// Check if webcam access is supported.
function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will 
// define in the next step.
if (getUserMediaSupported()) {
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event) {
    // Only continue if the COCO-SSD has finished loading.
    if (!model) {
        return;
    }

    // Hide the button once clicked.
    event.target.classList.add('removed');

    // getUsermedia parameters to force video but not audio.
    const constraints = {
        video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment 
// to get everything needed to run.
// Note: cocoSsd is an external object loaded from our index.html
// script tag import so ignore any warning.
cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
    // Show demo section now model is ready to use.
    demosSection.classList.remove('invisible');
});

function predictWebcam(){
    model.detect(video).then((predictions)=>{
        // remove previous highlighting from HTML
        for(let i=0; i<children.length; i++){
            liveView.removeChild(children[i]);
        }

        // remove all elements from children array
        children.splice(0);

        console.log('predictions: ', predictions);

        // loop through predictions and create them over liveView
        // only if confidence score is higher than 66% of model. 
        for(let i=0; i<predictions.length; i++){
            if(predictions[i].score > 0.66){
                const p = document.createElement('p');
                p.innerText = predictions[i].class + ' - with ' 
                    + Math.round(parseFloat(predictions[i].score)*100)
                    + '% confidence';
                
                p.style = 'margin-left: ' + predictions[i].bbox[0] 
                    + 'px; margin-top: ' + (predictions[i].bbox[1] - 10) 
                    + 'px; width: ' + (predictions[i].bbox[2] - 10) 
                    + 'px; top: 0; left: 0;';
                
                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: ' + predictions[i].bbox[0] 
                + 'px; top: ' + predictions[i].bbox[1] 
                + 'px; width: ' + predictions[i].bbox[2] 
                + 'px; height: ' + predictions[i].bbox[3] + 'px;'; 

                liveView.appendChild(highlighter);
                liveView.appendChild(p);
                children.push(highlighter);
                children.push(p);
            }
        }
        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    })
}
