(function(_, $, undefined) {

function _generateProblems(r1, r2, n) {
  // Generate cartesian product, shuffle, and take n.
  // No, it isn't the most efficient, but we're not dealing with enough numbers
  // to warrant anything faster.
  var prod = [];
  for (var i1 = 0; i1 < r1.length; i1++) {
    for (var i2 = 0; i2 < r2.length; i2++) {
      prod.push([r1[i1], r2[i2]]);
    }
  }
  return _.take(_.shuffle(prod), n);
}

function formatTime(t_s) {
  var s = ':' + _.padLeft('' + Math.floor(t_s) % 60, 2, '0'),
      m = ':' + _.padLeft('' + Math.floor(t_s / 60) % 60, 2, '0'),
      h = _.padLeft('' + Math.floor(t_s / 3600), 2, '0');

  if (h === '00') {
    h = '';
    if (m == ':00') {
      m = '';
    }
  }
  return h + m + s;
}

function drawProgress(canvas, i, n, elapsed_ms) {
  var h = 20;
  var progressProps = {
    text: '' + i + ' / ' + n,
    fillStyle: 'black',
    fontFamily: 'serif',
    fontSize: h + 'px',
    fontWeight: 'normal',
    x: 0, y: 0,
    fromCenter: false,
  };

  var elapsedProps = {
    text: formatTime(Math.floor(elapsed_ms / 1000)),
    fillStyle: 'black',
    fontFamily: 'serif',
    fontSize: h + 'px',
    fontWeight: 'bold',
    x: 0, y: 0,
    fromCenter: false,
  };
  var elapsedWidth = canvas.measureText(elapsedProps).width;
  elapsedProps.x = canvas[0].width - elapsedWidth;

  canvas.drawText(progressProps);
  canvas.drawText(elapsedProps);
}

function drawProblem(canvas, mpair, answer) {
  var h = 40;
  var q = '' + mpair[0] + ' \u00D7 ' + mpair[1] + ' =  ';
  canvas[0].style.fontSize = h + 'px';
  var questionProps = {
    text: q,
    fillStyle: 'black',
    fontFamily: 'serif',
    fontSize: h + 'px',
    fontWeight: 'bold',
    maxWidth: canvas[0].width,
    x: 0,
    y: (canvas[0].height - h) / 2,
    fromCenter: false,
  };

  var blankProps = _.clone(questionProps);
  blankProps.text = '_____';

  var answerProps = _.clone(questionProps);
  answerProps.text = answer;

  var qw = canvas.measureText(questionProps).width;
  var bw = canvas.measureText(blankProps).width;
  var aw = canvas.measureText(answerProps).width;

  questionProps.x = (canvas[0].width - qw - bw) / 2;
  blankProps.x = questionProps.x + qw;

  var answerOffset = (bw - aw) / 2;
  answerProps.x = blankProps.x + answerOffset;

  canvas.drawText(questionProps);
  canvas.drawText(blankProps);
  canvas.drawText(answerProps);
}

function StatsBanner(w, h, duration, numCorrect, totalProblems) {
  this.duration = duration;
  this.timeleft = duration;
  this.numCorrect = numCorrect;
  this.numTotal = totalProblems;

  this.canvas = $('<canvas/>')
  .attr({width: w, height: h})
  .height(h)
  .drawRect({
    fillStyle: '#fff',
    x: 0, y: 0,
    width: w,
    height: h,
  })
  .drawText({
    text: '' + this.numCorrect + ' / ' + this.numTotal,
    fillStyle: '#000',
    fontSize: '40px',
    x: w / 2,
    y: h / 2,
    fromCenter: true,
  });
};

StatsBanner.prototype.tick = function(dt) {
  this.timeleft -= dt;
  if (this.timeleft <= 0) {
    return false;
  }
};

StatsBanner.prototype.draw = function(canvas) {
  canvas.clearCanvas();
  var opacity = 1 - (this.timeleft / this.duration);
  canvas.drawImage({
    x: 0, y: 0,
    fromCenter: false,
    source: this.canvas[0],
    opacity: opacity,
  });
};

function CountdownBanner(count) {
  this.count = count;
  this.elapsed = 0;
  this.nextTrigger = 1000;
}

CountdownBanner.prototype.draw = function(canvas) {
  canvas.clearCanvas()
  .drawText({
    fontSize: (canvas[0].height / 4) + 'px',
    fontWeight: 'bold',
    fontFamily: 'serif',
    fillStyle: 'black',
    x: canvas[0].width / 2,
    y: canvas[0].height / 2,
    text: "" + this.count,
  });
};

CountdownBanner.prototype.tick = function(dt) {
  if (this.count <= 0) {
    return false;
  }

  this.elapsed += dt;
  if (this.elapsed >= this.nextTrigger) {
    this.count--;
    if (this.count <= 0) {
      return false;
    }
    this.nextTrigger += 1000;
  }
  return true;
};

function PauseBanner(w, h) {
  this.w = w;
  this.h = h;

  var fh = Math.ceil(h / 2);

  this.canvas = $('<canvas/>').attr({width: w, height: h})
  .translateCanvas({
    translateX: w/2,
    translateY: h/2,
  })
  .drawRect({
    fillStyle: '#add8e6',
    opacity: 0.9,
    x: 0, y: 0,
    width: w, height: h,
  })
  .drawLine({
    strokeStyle: 'black',
    strokeWidth: 2,
    opacity: 0.9,
    x1: 0, y1: 0,
    x2: w, y1: 0,
  })
  .drawLine({
    strokeStyle: 'black',
    strokeWidth: 2,
    opacity: 0.9,
    x1: 0, y1: h,
    x2: w, y1: h,
  })
  .drawText({
    text: 'Paused',
    fillStyle: 'black',
    fontSize: fh,
    fontFamily: 'serif',
    fontWeight: 'bold',
  });
}

PauseBanner.prototype.draw = function(canvas) {
  var w = canvas[0].width;
  var h = canvas[0].height;
  canvas.drawImage({
    source: this.canvas[0],
    x: w / 2, y: h / 2,
  })
};

MultiplicationDrill = function(canvasID, config) {
  config = config || {};
  var canvas = $('#' + canvasID);
  var answer = '';
  var elapsed = 0;

  var range1 = config.range1 || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var range2 = config.range2 || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var numProblems = config.numProblems || 10;

  var onfinished = config.onfinished || function() {};

  var problems = _generateProblems(range1, range2, numProblems);
  var answers = [];
  var cur = 0;

  var paused = false;
  var running = false;

  var pauseBanner = new PauseBanner(canvas[0].width, canvas[0].height / 3);
  var numPauses = 0;

  function makeStatsBB(correct, total) {
    var statsBanner = new StatsBanner(canvas[0].width, canvas[0].height,
                                      1000, correct, total);
    return bigbang(window, {
      ondraw: function() {
        statsBanner.draw(canvas);
      },
      ontick: function(t, dt) {
        statsBanner.tick(dt);
      },
    });
  }

  var gameBB = this.gameBB = bigbang(window, {
    onstart: function() {
      elapsed = 0;
      cur = 0;
    },
    ontick: function(t_ms, dt_ms) {
      elapsed = t_ms;
      if (cur >= problems.length) {
        cur = problems.length - 1;
        gameBB.stop();
      }
    },
    ondraw: function() {
      canvas.clearCanvas();
      drawProgress(canvas, cur+1, problems.length, elapsed);
      drawProblem(canvas, problems[cur], answer);
    },
    onpause: function() {
      paused = true;
      running = true;
      numPauses++;
      pauseBanner.draw(canvas);
      console.log('paused');
    },
    onstart: function() {
      paused = false;
      running = true;
      console.log('started');
    },
    onstop: function() {
      paused = false;
      running = false;
      console.log('stopped');

      var correct = [],
          wrong = [];
      for (var i = 0; i < problems.length; i++) {
        var prob = problems[i],
            m1 = prob[0]|0,
            m2 = prob[1]|0,
            a = answers[i]|0;
        if (m1 * m2 === a) {
          correct.push([m1, m2, a]);
        } else {
          wrong.push([m1, m2, a]);
        }
      }
      onfinished(correct, wrong, formatTime(elapsed/1000), numPauses);
      makeStatsBB(correct.length, problems.length).start();
    },
    onkey: function(e) {
      if (!running) {
        return;
      }
      if (e.type === 'keydown' && e.keyCode == 8) { // backspace
        if (answer.length > 0) {
          answer = answer.slice(0, answer.length-1);
        }
        e.preventDefault();
        return;
      }
      if (e.type !== 'keypress') {
        return;
      }
      e.preventDefault();

      if (e.keyCode === 32) { // space
        if (paused) {
          gameBB.start();
        } else {
          gameBB.pause();
        }
        return;
      }
      if (paused) {
        return;
      }

      if (e.keyCode === 13) { // return
        // check answer, unless no answer yet given
        if (answer === '') {
          console.log('no answer - ignoring return');
          return;
        }
        answers.push(answer|0);
        // Go to the next problem.
        answer = '';
        cur++;
        return;
      }

      if (e.charCode >= 48 && e.charCode < 58) { // digit
        if (answer.length >= 5) {
          console.log('answer too long - ignoring', answer);
          return;
        }
        answer += String.fromCharCode(e.charCode);
      }
    },
  });

  var countdownBanner = new CountdownBanner(3);
  var countdownBB = this.countdownBB = bigbang(window, {
    ontick: function(t, dt) {
      if (countdownBanner.tick(dt) === false) {
        return false;
      }
    },
    ondraw: function() {
      countdownBanner.draw(canvas);
    },
    onstop: function() {
      gameBB.start();
    },
  });
}

MultiplicationDrill.prototype.start = function() {
  this.countdownBB.start();
};

}(_, $));
