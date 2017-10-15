
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.y = 100;

let controls;
controls = new THREE.OrbitControls( camera );

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(new THREE.Color(0, 0, 1), 0.2);
document.body.appendChild( renderer.domElement );

// TODO change to canvas
let mouseDown = false;
document.body.addEventListener('mousedown', function(){
  mouseDown = true;
});
document.body.addEventListener('mouseup', function(){
  mouseDown = false;
});

let theta = 0;
let radius= 200;
let speed = 2;


var outputCanvas = document.getElementById('outputCanvas');
var outputContext = outputCanvas.getContext('2d');
var inputCanvas = document.getElementById('inputCanvas');
var inputContext = inputCanvas.getContext('2d');


let graph = new GraphImage(scene, inputContext,outputContext);
graph.setInputFile('Lenna.png');

var radios = document.forms["inputFile"].elements["file"];
for(var i = 0, max = radios.length; i < max; i++) {
    radios[i].onclick = function() {
        graph.setInputFile(this.value);
    }
}

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

