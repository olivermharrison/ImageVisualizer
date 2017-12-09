
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
camera.position.y = 200;



var renderer = new THREE.WebGLRenderer({ antialias: true });
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
graph.setInputFile('Lenna.png');


document.getElementById('thresholdSlider').oninput = function(e) {
  document.getElementById('thresholdButton').innerText = 'threshold:' + this.value;
  graph.setThreshold(this.value);
}
document.getElementById('quantizeSlider').oninput = function(e) {
  document.getElementById('quantizeButton').innerText = 'quantize:' + this.value;
}

document.getElementById('inputFiles').addEventListener('change', function(){
  console.log(this.value);
  graph.setInputFile(this.value);
});

var animate = function () {
  requestAnimationFrame( animate );
  theta += 0.2;
  camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
  //camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
  camera.lookAt( scene.position );
  graph.update();

  renderer.render(scene, camera);
};

animate();

function uploadImage(){
  var file    = document.querySelector('input[type=file]').files[0];
  var reader  = new FileReader();

  if (file) {
    reader.readAsDataURL(file); 
  }

  reader.onloadend = function () {
    console.log(reader);  
    graph.setInputFile(reader.result);
  } 
}

function dlCanvas() {
  var dt = outputCanvas.toDataURL('image/png');
  dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
  dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');

  this.href = dt;
};
document.getElementById("dl").addEventListener('click', dlCanvas, false);
