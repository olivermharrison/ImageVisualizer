
function GraphImage(scene, inputContext, outputContext) {

  this.scene = scene;
  this.inputContext = inputContext;
  this.outputContext = outputContext;
  this.inputData = [];
  this.outputData = [];

  this.image = new Image();

  this.divisor = 100;
  this.spheres = [];

  this.copies = [];
  this.targets = [];

  this.animLength = 0;
  this.count = 0;

  this.setInputFile = function(file) {
    let self = this;
    this.image.src = file;
    this.image.onload = function() {

      self.inputContext.drawImage(self.image, 0, 0);
      self.inputData = self.inputContext.getImageData(0, 0, self.image.width, self.image.height).data;

      self.outputData = self.inputData;
      self.outputContext.drawImage(self.image, 0, 0);

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

  this.invert = function() {
    if (this.animLength > 0) {
      console.log("still animating.");
      return;
    }
    this.targets = [];
    this.copies = [];
    this.count = 0;
    this.animLength =50;
    for (var i=0; i<this.outputData.length; i++) {
      if ((i-3)%4 == 0) { // alpha
        this.targets.push(255);
        this.copies.push(255);
      } else {
        this.targets.push((255 - this.outputData[i]));
        this.copies.push(this.outputData[i]);
      }
    }
  }

  this.greyscale = function() {
    if (this.animLength > 0) {
      console.log("still animating.");
      return;
    }
    this.targets = [];
    this.copies = [];
    this.count = 0;
    this.animLength = 50;
    for (var i=0; i<this.outputData.length; i+=4) {
      let avg = Math.floor((this.outputData[i] + this.outputData[i+1] + this.outputData[i+2])/3);
      for (var j=0; j<3; j++) {
        this.targets.push(avg);
        this.copies.push(this.outputData[i+j]);
      }
      this.targets.push(255);
      this.copies.push(255);;
    }
  }


  this.update = function() {
    if (this.animLength > 0) {
      this.count++;
      let output = this.outputContext.createImageData(223,226);
        for (var i=0; i<this.outputData.length; i++) {
          this.outputData[i] = THREE.Math.lerp(this.copies[i], this.targets[i], this.count/this.animLength);
          output.data[i] = this.outputData[i];

          if (i%(4*this.divisor) === 0) {
            let sphere = this.spheres[i/(4*this.divisor)];
            let pos = (new THREE.Vector3(this.copies[i]-128, this.copies[i+1]-128, this.copies[i+2]-128)).lerp(new THREE.Vector3(this.targets[i]-128, this.targets[i+1]-128, this.targets[i+2]-128), this.count/this.animLength);
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
        }
    }
  }
}
