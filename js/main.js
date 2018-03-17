
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
camera.position.y = 200;



var renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize( window.innerWidth, window.innerHeight );
//renderer.setClearColor(new THREE.Color(0, 0, 1), 0.2);
document.body.appendChild( renderer.domElement );

let controls;
controls = new THREE.OrbitControls( camera, renderer.domElement);

var ambientLight = new THREE.AmbientLight( 0xffffff );
scene.add( ambientLight );



let mouseDown = false;
renderer.domElement.addEventListener('mousedown', function(){
  mouseDown = true;
});
renderer.domElement.addEventListener('mouseup', function(){
  mouseDown = false;
});

let theta = 0;
let radius= 200;
var outputCanvas = document.getElementById('outputCanvas');
var outputContext = outputCanvas.getContext('2d');
var inputCanvas = document.getElementById('inputCanvas');
var inputContext = inputCanvas.getContext('2d');
let graph = new GraphImage(scene, inputContext,outputContext);
graph.setInputFile('img/examples/color.jpg');

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

document.getElementById('inputFiles').addEventListener('change', function(){
  const prefix = 'img/examples/';
  graph.setInputFile(prefix + this.value);
});

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

var animate = function () {
  requestAnimationFrame( animate );

  stats.begin();
  theta += 0.2;
  camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
  //camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
  camera.lookAt( scene.position );
  graph.update();

  renderer.render(scene, camera);
  stats.end();
};

animate();

function uploadImage(){
  var file    = document.querySelector('input[type=file]').files[0];
  var reader  = new FileReader();

  if (file) {
    reader.readAsDataURL(file); 
  }

  reader.onloadend = function () {
    document.getElementById('inputFiles').children[0].selected = true
    graph.setInputFile(reader.result);
  } 
}