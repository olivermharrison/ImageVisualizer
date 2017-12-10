
function GraphImage(scene, inputContext, outputContext) {

  this.scene = scene;
  this.inputContext = inputContext;
  this.outputContext = outputContext;
  this.inputData = [];
  this.outputData = [];

  this.image = new Image();

  this.divisor = 10;


  this.particles = null;

  this.updates = [];
  this.undo = false;

  // animation vars
  this.animLength = 0;
  this.count = 0;

  // oepration vars
  this.brightness = 1.5;
  this.numCentroids = 10;  // k means operation
  this.threshold = 128;   // threshold opertation

  this.setInputFile = function(file) {
    let self = this;
    this.updates = [];
    this.image.src = file;

    let resize = true;

    this.image.onload = function() {
      if (resize) {
        self.image.src = resizeImage(self.image);
        resize = false;
        return;
      }
      
      let inputCanvas = document.getElementById('inputCanvas');
      let outputCanvas = document.getElementById('outputCanvas');      
      outputCanvas.width = inputCanvas.width = self.image.width;
      outputCanvas.height = inputCanvas.height = self.image.height;
      //self.divisor = self.image.width/2;

      self.inputContext.drawImage(self.image, 0, 0);
      self.inputData = self.inputContext.getImageData(0, 0, self.image.width, self.image.height).data;

      self.outputData = self.inputData;
      self.outputContext.drawImage(self.image, 0, 0);
      self.updates.push(self.outputData.slice());


      if (self.particles) {
        self.scene.remove(self.particles);
      }

      let geometry = new THREE.Geometry();
      let sprite = new THREE.TextureLoader().load( "circle.png" );
      sprite.anisotropy = 0;
      sprite.magFilter = THREE.NearestFilter;
      sprite.minFilter = THREE.NearestFilter;
      
      let material = new THREE.PointsMaterial( { size: 5,vertexColors: THREE.VertexColors, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: false } );
      let colors = [];
      for (var i=0; i<self.inputData.length; i+=self.divisor*4) {
        var vertex = new THREE.Vector3();
        vertex.x = self.inputData[i]-128;
        vertex.y = self.inputData[i+1]-128;
        vertex.z = self.inputData[i+2]-128;
        geometry.vertices.push( vertex );

        let color = new THREE.Color(self.inputData[i]/255,self.inputData[i+1]/255, self.inputData[i+2]/255 );
        colors.push(color);
      }
      geometry.colors = colors;


      self.particles = new THREE.Points( geometry, material );
      scene.add( self.particles );
    };
  }

  this.applyOperation = function(operation) {
    let self = this;
    if (this.animLength > 0) {
      console.log("still animating.");
      return;
    }
    this.count = 0;
    this.animLength = 50;

    switch(operation) {
      case 'greyscale':
        this.updates.push([]);
        for (var i=0; i<this.outputData.length; i+=4) {
          let avg = Math.floor((this.outputData[i] + this.outputData[i+1] + this.outputData[i+2])/3);
          for (var j=0; j<3; j++) {
            this.updates[this.updates.length -1].push(avg);
          }
          this.updates[this.updates.length -1].push(255);
        }
        break;
      case 'invert':
        this.updates.push([]);
        for (var i=0; i<this.outputData.length; i++) {
          if ((i-3)%4 == 0) { // alpha
            this.updates[this.updates.length -1].push(255);
          } else {
            this.updates[this.updates.length -1].push((255 - this.updates[this.updates.length - 2][i]));
          }

        }
        break;
      case 'threshold':
        this.updates.push([]);
        for (var i=0; i<this.outputData.length; i++) {
          if ((i-3)%4 == 0) { // alpha
            this.updates[this.updates.length -1].push(255);
          } else {
            let target = (this.outputData[i] > this.threshold) ? 255 : 0;
            this.updates[this.updates.length -1].push(target);
          }
        }
        break;
      case 'brightness':
        this.updates.push([]);
        for (var i=0; i<this.outputData.length; i++) {
          if ((i-3)%4 == 0) { // alpha
            this.updates[this.updates.length -1].push(255);
          } else {
            let target = this.outputData[i]*this.brightness;
            this.updates[this.updates.length -1].push(target);
          }
        }
        break;
      case 'undo':
        if (this.updates.length > 1) {
          this.undo = true;
        } else {
          console.log('no');
          this.animLength = 0;
        }
        break;
      case 'reset':
        if (this.updates.length > 1) {
          this.updates = [this.updates[0], this.updates[this.updates.length -1]];
          this.undo = true;
        } else {
          console.log('no');
          this.animLength = 0;
        }
        break;
      case 'kmeans':
        this.animLength = 0;
        this.runKMeans();
        break;
      default:
        console.log('Unrecognized operation.');
        break;
    }
  }

  this.setBrightness = function(brightness) {
    this.brightness = brightness;
  }

  this.setThreshold = function(threshold) {
    this.threshold = threshold;
  }
  this.setNumCentroids = function(k) {
    this.numCentroids = k;
  }

  this.update = function() {
    let self = this;
    if (this.animLength > 0) {
      this.count++;

      let output = this.outputContext.createImageData(this.image.width,this.image.height);
      for (var i=0; i<this.outputData.length; i++) {

        // IMAGE OPS
        if (this.undo) {
          this.outputData[i] = THREE.Math.lerp(this.updates[this.updates.length-1][i], this.updates[this.updates.length-2][i], this.count/this.animLength);
        } else {
          this.outputData[i] = THREE.Math.lerp(this.updates[this.updates.length-2][i], this.updates[this.updates.length-1][i], this.count/this.animLength);
        }
        output.data[i] = this.outputData[i];

        // THREEJS ops
        if (i%(4*this.divisor) === 0) {
          let from, to = null;
          if (this.undo) {
            from = new THREE.Vector3(this.updates[this.updates.length-1][i]-128, this.updates[this.updates.length-1][i+1]-128, this.updates[this.updates.length-1][i+2]-128);
            to = new THREE.Vector3(this.updates[this.updates.length-2][i]-128, this.updates[this.updates.length-2][i+1]-128, this.updates[this.updates.length-2][i+2]-128);
          } else {
            from = new THREE.Vector3(this.updates[this.updates.length-2][i]-128, this.updates[this.updates.length-2][i+1]-128, this.updates[this.updates.length-2][i+2]-128);
            to = new THREE.Vector3(this.updates[this.updates.length-1][i]-128, this.updates[this.updates.length-1][i+1]-128, this.updates[this.updates.length-1][i+2]-128);
          }

          let pos = (from).lerp(to, this.count/this.animLength);
          
          self.particles.geometry.vertices[i/(4*this.divisor)] = pos;
          self.particles.geometry.colors[i/(4*this.divisor)] = new THREE.Color((pos.x + 128)/255, (pos.y + 128)/255, (pos.z + 128)/255);;
        }
      }
      // TODO lerp size of points
      //self.particles.material.size = 20;

      self.particles.geometry.verticesNeedUpdate = true;
      self.particles.geometry.colorsNeedUpdate = true;

      this.outputContext.putImageData( output , 0, 0 );

      if (this.count >= this.animLength) {
        this.animLength = 0;
        this.count = 0;
        if (this.undo) {
          this.undo = false;
          this.updates.pop();
        }
      }
    }
  }

  this.runKMeans = function() {
    let self = this;

    let converged = false;
    let iteration = 1;
    let pixelCentroids = []; // stores the index of the centroid that each pixel is assigned to
    let updateDiv = document.getElementById('opUpdates');

    // 1) initialize k centroids randomly 
    let centroids = [];
    for (let i=0; i<this.numCentroids; ++i) {
      centroids.push(new THREE.Vector3(Math.random()*255, Math.random()*255, Math.random()*255));
    }

    // centroid spheres:
    let spheres = [];
    centroids.forEach(function(centroid){
      let geometry = new THREE.Geometry();
      let sprite = new THREE.TextureLoader().load( "circle.png" );
      sprite.anisotropy = 0;
      sprite.magFilter = THREE.NearestFilter;
      sprite.minFilter = THREE.NearestFilter;
      let material = new THREE.PointsMaterial( { size: 40,vertexColors: THREE.VertexColors, sizeAttenuation: true, map: sprite,transparent: true, opacity:0 } );
      var vertex = new THREE.Vector3(centroid.x-128, centroid.y-128, centroid.z-128);
      geometry.vertices.push( vertex );
      geometry.colors = [new THREE.Color(centroid.x/255, centroid.y/255, centroid.z/255)];

      let sphere = new THREE.Points( geometry, material );
      self.scene.add( sphere );
      spheres.push(sphere);
    });

    console.log(spheres);

    let loop = setInterval(kmeansIteration, 33);

    function kmeansIteration() {
      updateDiv.innerHTML = 'Running K Means with k=' + self.numCentroids + "<br> Iteration " + iteration;

      // 1) assign pixels to their nearest centroids
      for (let i=0; i<self.outputData.length; i+=4) { // for each pixel
        let minDistance = 1000000;
        let c = 0;
        pixelCentroids[i/4] = 0;
        centroids.forEach(function(centroid){    // for each centroid
          let distance = Math.sqrt(Math.pow(self.outputData[i] - centroid.x, 2) + Math.pow(self.outputData[i+1] - centroid.y, 2) + Math.pow(self.outputData[i+2] - centroid.z, 2));
          if (distance < minDistance) {
            pixelCentroids[i/4] = c;
            minDistance = distance;
          }
          c++;
        });
      }

      // 2) Recalculate centroids
      let centroidsCopy = [];
      // reset centroids
      for (let k=0; k<self.numCentroids; ++k) {
        centroidsCopy.push({value: centroids[k], count: 0});
        centroids[k] = new THREE.Vector3(0, 0, 0);
      }
      
      // sum pixels nearest to centroid
      for (let i=0; i<self.outputData.length; i+=4) { // for each pixel
        centroids[pixelCentroids[i/4]].x += self.outputData[i];
        centroids[pixelCentroids[i/4]].y += self.outputData[i+1];
        centroids[pixelCentroids[i/4]].z += self.outputData[i+2];
        centroidsCopy[pixelCentroids[i/4]].count++;
      }

      // find average
      converged = true;
      for (let k=0; k<self.numCentroids; ++k) {
        if (centroidsCopy[k].count > 0) {
          centroids[k].divideScalar(centroidsCopy[k].count);
        }
        if (centroids[k].distanceTo(centroidsCopy[k].value) > 0) {
          converged = false;
        }
      }

      // update centroid sphere
      for (let i=0; i<centroids.length; ++i) {
        spheres[i].geometry.vertices[0] = new THREE.Vector3(centroids[i].x-128, centroids[i].y-128, centroids[i].z-128);
        spheres[i].geometry.verticesNeedUpdate = true;
        spheres[i].geometry.colorsNeedUpdate = true;
        spheres[i].geometry.colors[0] = new THREE.Color(centroids[i].x/255, centroids[i].y/255, centroids[i].z/255 );
        spheres[i].material.opacity = 1;
      }

      iteration++;

      if (converged) {
        clearInterval(loop);
        
        updateDiv.innerText = "K Means has converged after " + iteration + " iterations.";
        setTimeout(function(){
          updateDiv.innerText = "";
        }, 3000);

        spheres.forEach(function(sphere){
          self.scene.remove(sphere);
        });
    
        // setup the animation
        self.count = 0;
        self.animLength = 50;
        self.updates.push([]);
        for (var i=0; i<self.outputData.length; i+=4) {
          self.updates[self.updates.length -1].push(centroids[pixelCentroids[i/4]].x);
          self.updates[self.updates.length -1].push(centroids[pixelCentroids[i/4]].y);
          self.updates[self.updates.length -1].push(centroids[pixelCentroids[i/4]].z);
          self.updates[self.updates.length -1].push(255);
        }
      }
    }
  }
}

// TODO cross browser
let maxSize = 256;
let maxWidth = (window.innerWidth*0.3 <= maxSize) ? window.innerWidth*0.3 : maxSize;
let maxHeight = (window.innerHeight*0.3 <= maxSize) ? window.innerHeight*0.3 : maxSize;

function resizeImage(image) {
  let originalWidth = image.width;
  let originalHeight = image.height;

  let widthFactor = originalWidth/maxWidth;
  let heightFactor = originalHeight/maxHeight;

  let scaleFactor = (widthFactor > heightFactor) ? widthFactor : heightFactor;

  let newWidth = Math.floor(originalWidth/scaleFactor);
  let newHeight = Math.floor(originalHeight/scaleFactor);

  console.log("Resizing image from " + originalWidth + "x" + originalHeight + " to " + newWidth + "x" + newHeight);

  // create an off-screen canvas
  var canvas = document.createElement('canvas'),
  ctx = canvas.getContext('2d');
  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.drawImage(image, 0, 0, newWidth, newHeight);

  // encode image to data-uri with base64 version of compressed image
  return canvas.toDataURL();
}