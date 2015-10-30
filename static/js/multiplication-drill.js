(function(_, $, undefined) {
"strict";

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

function _getElement(el) {
  return (typeof el === 'string') ? $('#' + el) : $(el);
}

function formatTime(t_s) {
  var s = _.padLeft('' + Math.floor(t_s) % 60, 2, '0'),
      m = _.padLeft('' + Math.floor(t_s / 60) % 60, 2, '0'),
      h = _.padLeft('' + Math.floor(t_s / 3600), 2, '0');

  h = (h === '00') ? '' : h + ':';

  return h + m + ':' + s;
}

MultiplicationDrill = function(parent, config) {
  parent = _getElement(parent);

  config = config || {};
  var range1 = config.range1 || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var range2 = config.range2 || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var numProblems = config.numProblems || 10;

  var onFinished = config.onFinished || function() {};

  var problems = _generateProblems(range1, range2, numProblems);
  var answers = [];
  var cur = 0;
  var numPauses = 0;

  var fields = this._makeContainer(parent);

  function showProgress() {
    if (cur >= numProblems) {
      fields.progress.text('Done');
    } else {
      fields.progress.text((cur + 1) + ' / ' + numProblems);
    }
  }

  function showClock() {
    fields.clock.text(formatTime(elapsed));
  }

  function showProblem() {
    if (cur >= numProblems) {
      fields.problem.hide();
      return;
    }
    fields.problem.show();
    var q1 = problems[cur][0],
        q2 = problems[cur][1];
    fields.question.text(q1 + ' \u00D7 ' + q2 + ' =  ');
  }

  function submitAnswer() {
    if (!running) {
      return;
    }
    var answer = fields.answer.val();
    if (answer === '') {
      return;
    }
    cur++;
    answers.push(answer);
    fields.answer.val('');
    showProblem();
  }

  fields.body.hide();
  fields.pauseBody.hide();

  fields.answerForm.submit(function(e) {
    e.preventDefault();
    submitAnswer();
    return false;
  });

  fields.answer.on('keydown', function(e) {
    if (e.which === 9) { // tab key (Android Done key)
      e.preventDefault();
      submitAnswer();
    }
  });

  var elapsed = 0;
  var running = false;
  var paused = false;

  var bb = bigbang(parent[0], {
    interval: 100,
    onmouse: function(e) {
      if (running && e.type === 'mousedown') {
        e.preventDefault();
        if (paused) {
          bb.start();
        } else {
          bb.pause();
        }
      }
    },
    onstart: function() {
      running = true;
      paused = false;
      fields.pauseBody.hide();
      fields.body.show();
      showProblem();
    },
    onpause: function() {
      running = true;
      paused = true;
      numPauses++;
      fields.body.hide();
      fields.pauseBody.show();
    },
    onstop: function() {
      running = false;
      paused = false;

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
      onFinished(correct, wrong, formatTime(elapsed), numPauses);
    },
    ontick: function(t, dt) {
      elapsed = t / 1000;
      if (cur >= numProblems) {
        return false;
      }
      showClock();
      showProgress();
      fields.answer.focus();
    },
  });

  this.start = bb.start;
  this.stop = bb.stop;
  this.pause = bb.pause;
};

MultiplicationDrill.prototype._makeContainer = function(parent) {
  // Create a game div with a slim header and footer, and with the problems
  // centered in the main section.
  var container = $('<div>')
  .attr({'id': 'container'})
  .css({
    'position': 'relative',
    'width': '100%',
    'height': '100%',
  });

  var clockCell = $('<span>');
  var progressCell = $('<span>');

  var header = $('<table>')
  .attr({'id': 'header'})
  .css({
    'position': 'absolute',
    'top': 0,
    'left': 0,
    'height': '5%',
    'width': '100%',
    'padding': '2px 10px 2px 10px',
    'font-size': '20pt',
    'font-weight': 'bold',
    'font-family': 'sans-serif,arial,helvetica',
  })
  .append($('<tr>')
          .append($('<td>')
                  .attr({'id': 'headleft'})
                  .css({
                    'width': '50%',
                    'text-align': 'left',
                  })
                  .append(progressCell))
          .append($('<td>')
                  .attr({'id': 'headright'})
                  .css({
                    'width': '50%',
                    'text-align': 'right',
                  })
                  .append(clockCell)))
                  .appendTo(container);

  var footer = $('<table>')
  .attr({'id': 'footer'})
  .css({
    'position': 'absolute',
    'bottom': 0,
    'left': 0,
    'height': '5%',
    'width': '100%',
    'padding': '2px 10px 2px 10px',
    'font-size': '20pt',
    'font-weight': 'bold',
    'font-family': 'sans-serif,arial,helvetica',
  })
  .append($('<tr>')
          .append($('<td>')
                  .attr({'id': 'footleft'})
                  .css({
                    'width': '50%',
                    'text-align': 'left',
                  }))
          .append($('<td>')
                  .attr({'id': 'footright'})
                  .css({
                    'width': '50%',
                    'text-align': 'right',
                  })))
  .appendTo(container);

  var body = $('<div>')
  .attr({'id': 'body'})
  .css({
    'position': 'absolute',
    'top': 0,
    'bottom': 0,
    'left': 0,
    'right': 0,
    'padding': '5% 2px 5% 2px',
    'font-weight': 'bold',
    'font-family': 'sans-serif,arial,helvetica',
    'font-size': '25pt',
    'text-align': 'center',
  })
  .appendTo(container);

  var pauseBody = $('<div>')
  .attr({'id': 'pauseBody'})
  .css({
    'position': 'absolute',
    'top': 0,
    'bottom': 0,
    'left': 0,
    'right': 0,
    'padding': '5% 2px 5% 2px',
    'font-weight': 'bold',
    'font-family': 'sans-serif,arial,helvetica',
    'font-size': '40pt',
    'text-align': 'center',
  })
  .append($('<span>')
          .attr({'id': 'pause'})
          .css({
            'position': 'absolute',
            'left': 0,
            'right': 0,
            'top': '50%',
            'transform': 'translateY(-50%)',
            'text-align': 'center',
          })
          .text('PAUSED'))
  .appendTo(container);

  var answerForm = $('<form>').appendTo(body);

  var problem = $('<span>')
  .attr({'id': 'problem'})
  .css({
    'position': 'absolute',
    'left': 0,
    'right': 0,
    'top': '50%',
    'transform': 'translateY(-50%)',
    'text-align': 'center',
  })
  .appendTo(answerForm);

  var question = $('<span>')
  .attr({'id': 'question'})
  .text('problem = ')
  .appendTo(problem);

  var answer = $('<input>')
  .attr({
    'id': 'answer',
    'type': 'number',
    'size': 5,
    'autofocus': true,
  })
  .css({
    'border': 0,
    'border-bottom': '3px solid black',
    'font-size': '25pt',
    'width': '3em',
  })
  .appendTo(problem);

  parent.append(container);

  return {
    'container': container,
    'clock': clockCell,
    'body': body,
    'pauseBody': pauseBody,
    'progress': progressCell,
    'problem': problem,
    'question': question,
    'answer': answer,
    'answerForm': answerForm,
  };
};

Countdown = function(parent, config) {
  config = config || {};

  var onFinished = config.onFinished || function() {};

  parent = _getElement(parent);

  var remaining = 3;
  var nextDecrement = 1000;

  var fields = this._makeContainer(parent);

  fields.counter.hide();
  fields.counter.text(remaining);

  var bb = bigbang(parent[0], {
    interval: 100,
    ontick: function(t, dt) {
      if (t >= nextDecrement) {
        nextDecrement += 1000;
        remaining--;
        if (remaining === -1) {
          return false;
        }
      }
      if (remaining === 0) {
        fields.counter.text('Go!');
      } else {
        fields.counter.text(remaining);
      }
    },
    onstart: function() {
      fields.counter.show();
    },
    onstop: function() {
      onFinished();
    },
  });

  this.start = bb.start;
  this.stop = bb.stop;
  this.pause = bb.pause;
};

Countdown.prototype._makeContainer = function(parent) {
  var container = $('<div>')
  .attr({'id': 'container'})
  .css({
    'position': 'relative',
    'width': '100%',
    'height': '100%',
  });

  var body = $('<div>')
  .attr({'id': 'body'})
  .css({
    'position': 'absolute',
    'top': 0,
    'left': 0,
    'right': 0,
    'bottom': 0,
    'font-weight': 'bold',
    'font-size': '50pt',
    'font-family': 'sans-serif,arial,helvetica',
    'text-align': 'center',
  })
  .appendTo(container);

  var counter = $('<span>')
  .attr({'id': 'counter'})
  .css({
    'position': 'absolute',
    'left': 0,
    'right': 0,
    'top': '50%',
    'transform': 'translateY(-50%)',
    'text-align': 'center',
  })
  .appendTo(body);

  parent.append(container);

  return {
    'container': container,
    'body': body,
    'counter': counter,
  };
};

}(_, $));
