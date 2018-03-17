/* Scene Setup */
var scene = new THREE.Scene();

// lights
var ambientLight = new THREE.AmbientLight( 0xffffff );
scene.add( ambientLight );

// camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
camera.position.y = 300;
var renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// action!
let controls;
controls = new THREE.OrbitControls( camera, renderer.domElement);

/* IO Images */
var outputCanvas = document.getElementById('outputCanvas');
var outputContext = outputCanvas.getContext('2d');
var inputCanvas = document.getElementById('inputCanvas');
var inputContext = inputCanvas.getContext('2d');

let graph = new GraphImage(scene, inputContext,outputContext);
graph.setInputFile('img/examples/color.jpg');

/* Input Controls */
document.getElementById('brightnessSlider').oninput = function(e) {
  document.getElementById('brightnessButton').innerText = 'brightness:' +  Math.floor(100*this.value) + "%";
  graph.setBrightness(this.value);
}
document.getElementById('thresholdSlider').oninput = function(e) {
  document.getElementById('thresholdButton').innerText = 'threshold:' + this.value;
  graph.setThreshold(this.value);
}
document.getElementById('quantizeSlider').oninput = function(e) {
  document.getElementById('quantizeButton').innerText = 'quantize:' + this.value;
  graph.setNumCentroids(this.value);
}

/* FPS Meter */
var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

/* Image Selection & Upload */
document.getElementById('inputFiles').addEventListener('change', function(){
  const prefix = 'img/examples/';
  graph.setInputFile(prefix + this.value);
});

function uploadImage(){
  var file = document.querySelector('input[type=file]').files[0];
  var reader = new FileReader();

  if (file) reader.readAsDataURL(file); 

  reader.onloadend = function () {
    document.getElementById('inputFiles').children[0].selected = true
    graph.setInputFile(reader.result);
  } 
}

/* Update Loop */
let theta = 0;
let radius= 200;

var animate = function () {
  requestAnimationFrame( animate );

  stats.begin();
  theta += 0.2;
  camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
  camera.lookAt( scene.position );
  graph.update();

  renderer.render(scene, camera);
  stats.end();
};
animate();