
function GraphImage(scene, inputContext, outputContext) {

  this.scene = scene;
  this.inputContext = inputContext;
  this.outputContext = outputContext;
  this.inputData = [];
  this.outputData = [];

  this.image = new Image();

  this.divisor = 50;
  this.spheres = [];

  this.updates = [];
  this.undo = false;

  this.animLength = 0;
  this.count = 0;

  this.setInputFile = function(file) {
    let self = this;
    this.spheres.forEach(function(sphere){
      this.scene.remove(sphere);
    });
    this.spheres = [];
    this.updates = [];

    this.image.src = file;
    this.image.onload = function() {

      let inputCanvas = document.getElementById('inputCanvas');
      let outputCanvas = document.getElementById('outputCanvas');
      outputCanvas.width = inputCanvas.width = self.image.width;
      outputCanvas.height = inputCanvas.height = self.image.height;
      //self.divisor = self.image.width/2;

      self.inputContext.drawImage(self.image, 0, 0);
      self.inputData = self.inputContext.getImageData(0, 0, self.image.width, self.image.height).data;

      self.outputData = self.inputData;
      self.outputContext.drawImage(self.image, 0, 0);
      self.updates.push(self.outputData);

      for (var i=0; i<self.inputData.length; i+=self.divisor*4) {
        let geometry = new THREE.SphereGeometry( 2, 8, 8 );
        let material = new THREE.MeshBasicMaterial( { color: new THREE.Color(self.inputData[i]/255,self.inputData[i+1]/255, self.inputData[i+2]/255 )});
        let sphere = new THREE.Mesh( geometry, material );
        sphere.translateX(self.inputData[i]-128);
        sphere.translateY(self.inputData[i+1]-128);
        sphere.translateZ(self.inputData[i+2]-128);
        self.scene.add( sphere );
        self.spheres.push(sphere);
      }
    };
  }

  this.applyOperation = function(operation) {
    if (this.animLength > 0) {
      console.log("still animating.");
      return;
    }
    this.targets = [];
    this.copies = [];
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
        let threshold = 127;
        this.updates.push([]);
        for (var i=0; i<this.outputData.length; i++) {
          if ((i-3)%4 == 0) { // alpha
            this.updates[this.updates.length -1].push(255);
          } else {
            let target = (this.outputData[i] > threshold) ? 255 : 0;
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
      default:
        console.log('Unrecognized operation.');
        break;
    }
  }

  this.update = function() {
    if (this.animLength > 0) {
      this.count++;
      let output = this.outputContext.createImageData(this.image.width,this.image.height);
        for (var i=0; i<this.outputData.length; i++) {

          if (this.undo) {
            this.outputData[i] = THREE.Math.lerp(this.updates[this.updates.length-1][i], this.updates[this.updates.length-2][i], this.count/this.animLength);
          } else {
            this.outputData[i] = THREE.Math.lerp(this.updates[this.updates.length-2][i], this.updates[this.updates.length-1][i], this.count/this.animLength);
          }

          output.data[i] = this.outputData[i];

          if (i%(4*this.divisor) === 0) {
            let sphere = this.spheres[i/(4*this.divisor)];
            let from, to = null;
            if (this.undo) {
              from = new THREE.Vector3(this.updates[this.updates.length-1][i]-128, this.updates[this.updates.length-1][i+1]-128, this.updates[this.updates.length-1][i+2]-128);
              to = new THREE.Vector3(this.updates[this.updates.length-2][i]-128, this.updates[this.updates.length-2][i+1]-128, this.updates[this.updates.length-2][i+2]-128);
            } else {
              from = new THREE.Vector3(this.updates[this.updates.length-2][i]-128, this.updates[this.updates.length-2][i+1]-128, this.updates[this.updates.length-2][i+2]-128);
              to = new THREE.Vector3(this.updates[this.updates.length-1][i]-128, this.updates[this.updates.length-1][i+1]-128, this.updates[this.updates.length-1][i+2]-128);
            }

            let pos = (from).lerp(to, this.count/this.animLength);
            sphere.position.x = pos.x;
            sphere.position.y = pos.y;
            sphere.position.z = pos.z;
            sphere.material.color = new THREE.Color((sphere.position.x + 128)/255, (sphere.position.y + 128)/255, (sphere.position.z + 128)/255);
          }

        }

        this.outputContext.putImageData( output , 0, 0 );

        if (this.count >= this.animLength) {
          this.animLength = 0;
          this.count = 0;
          if (this.undo) {
            this.undo = false;
            this.updates.pop();
          }
          console.log('done');
        }
    }
  }
}
