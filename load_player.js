// load_player.js

document.addEventListener("DOMContentLoaded", function() {

    // --- Element Declarations ---
    const musicWrapper = document.getElementById("musicWrapper");
    const dragHandle = document.getElementById("dragHandle");
    const musicMini = document.getElementById("musicMini");
    const musicCard = document.getElementById("musicCard");
    const minBtn = document.getElementById("minBtn");
    
    const audio = document.getElementById("audio");
    const playBtn = document.getElementById("playBtn");
    const playIcon = document.getElementById("playIcon");
    const pauseIcon = document.getElementById("pauseIcon");
    const volume = document.getElementById("volume");
    const progress = document.querySelector(".progress");
    const canvas = document.getElementById("waveform");
    const ctx = canvas.getContext("2d");

    /* 🎚 Volume */
    volume.value = 0.7;
    audio.volume = 0.7;
    volume.oninput = () => audio.volume = volume.value;

    /* 🔊 REAL AUDIO VISUALIZER SETUP */
    const AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = AudioCtx.createMediaElementSource(audio);
    const analyser = AudioCtx.createAnalyser();
    src.connect(analyser);
    analyser.connect(AudioCtx.destination);
    analyser.fftSize = 64;

    const data = new Uint8Array(analyser.frequencyBinCount);


    /* ▶ Play / Pause (Chrome Autoplay Fix Included) */
    playBtn.onclick = () => {
      // CRITICAL FIX: Resume the AudioContext on the first interaction
      if (AudioCtx.state === 'suspended') {
          AudioCtx.resume();
      }
      if (audio.paused) {
        audio.play();
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
      } else {
        audio.pause();
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
      }
    };

    /* ⭕ Progress Ring */
    audio.ontimeupdate = () => {
      const percent = audio.currentTime / audio.duration;
      // 213 is the circumference of the progress ring (2 * π * r, where r=34)
      progress.style.strokeDashoffset = 213 - (213 * percent); 
    };

    function drawWave() {
      requestAnimationFrame(drawWave);
      analyser.getByteFrequencyData(data);

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.clearRect(0,0,canvas.width,canvas.height);
      data.forEach((v,i)=>{
        const barWidth = canvas.width / data.length;
        const barHeight = v / 255 * canvas.height;
        ctx.fillStyle = "rgba(90,192,255,0.8)";
        ctx.fillRect(i * barWidth, canvas.height-barHeight, barWidth-2, barHeight);
      });
    }
    drawWave();


    /* 🧲 DRAGGING LOGIC (Applied to the musicWrapper) */
    let isDragging = false;
    let currentX = 0; 
    let currentY = 0;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let wasDragged = false; 

    function setTranslate(xPos, yPos, el) {
      el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
    }

    function dragStart(e) {
      // Only start drag if clicking the handle or the mini icon
      if (e.target.id !== 'dragHandle' && e.target.id !== 'musicMini') {
          return; 
      }
      e.preventDefault(); 
      wasDragged = false; 

      let clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
      let clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
      
      // Calculate the starting point relative to the WRAPPER's last known position (xOffset, yOffset)
      initialX = clientX - xOffset;
      initialY = clientY - yOffset;

      isDragging = true;
      dragHandle.style.cursor = "grabbing";
      musicMini.style.cursor = "grabbing";
    }

    function dragEnd(e) {
      // CRITICAL: Only update the stored offset (xOffset, yOffset) when the drag ends
      xOffset = currentX;
      yOffset = currentY;
      isDragging = false;
      dragHandle.style.cursor = "grab";
      musicMini.style.cursor = "pointer";
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault(); 
        
        let clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

        // Calculate the new position by subtracting the initial offset from the current mouse/touch position
        currentX = clientX - initialX;
        currentY = clientY - initialY;
        
        // Set drag flag if movement is significant
        if (Math.abs(currentX - xOffset) > 5 || Math.abs(currentY - yOffset) > 5) {
            wasDragged = true;
        }

        setTranslate(currentX, currentY, musicWrapper);
        // The redundant updates of xOffset/yOffset have been removed from here for smoothness
      }
    }

    // Attach event listeners for mouse and touch events
    document.addEventListener("mousedown", dragStart, false);
    document.addEventListener("mouseup", dragEnd, false);
    document.addEventListener("mousemove", drag, false);
    document.addEventListener("touchstart", dragStart, false);
    document.addEventListener("touchend", dragEnd, false);
    document.addEventListener("touchmove", drag, false);


    /* 🎯 MINIMIZE / RESTORE (Updated for Dragging) */

    minBtn.onclick = () => {
      musicCard.style.display = "none";
      dragHandle.style.display = "none"; // Hide handle when minimized
      musicMini.style.display = "flex";
    };

    // Only restore the card if the mini icon was NOT dragged
    musicMini.onclick = (e) => {
        if (wasDragged) {
            wasDragged = false; // Reset flag and do nothing else
            return;
        }
        
        musicMini.style.display = "none";
        musicCard.style.display = "block";
        dragHandle.style.display = "flex"; // Show handle when restored
    };
}); // Closes the DOMContentLoaded listener
