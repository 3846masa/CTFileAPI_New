/* global $:false Handlebars:false marked:false */
$.fn.serializeJson = function() {
  var obj = {};
  $.each(this.serializeArray(), function() {
    obj[this.name] = this.value;
  });
  return obj;
};
$.fn.isVisible = function() {
  return $.expr.filters.visible(this[0]);
};

$(function(){

  var questionList = [];
  var userInfo = {};

  loadQuestionList()
    .then(filterQuestionList)
    .then(formSettings)
    .then(loadUserInfo);

  function loadQuestionList() {
    return fetch('./questionList.json')
      .then(function(res) { return res.json(); })
      .then(function(json) {
        questionList = json.map(function(f) { return f.split('-'); })
          .map(function(a) { return a.concat(a.splice(2).join('-')); })
          .map(function(a) { return {
            category: a[0],
            point: parseInt(a[1], 10),
            name: a[2],
            question: a.join('-')
          }; });
        return questionList;
      })
      .then(function(list) {
        var $category = $('#category');
        var source = $('template', $category).html();
        var template = Handlebars.compile(source);

        var categoryList =
          list.map(function(i) { return i.category; })
            .filter(function (x, i, self) { return self.indexOf(x) === i; })
            .sort();
        categoryList.forEach(function(category) {
          var $button = $(template({ category: category }));
          $category.append($button);
        });
        $('a', $category).on('click', filterQuestionList);
        return list;
      })
      .then(function(list) {
        var $qListContainer = $('main#qList');
        var source = $('template', $qListContainer).html();
        var template = Handlebars.compile(source);
        list.forEach(function(qInfo) {
          var $panel = $(template(qInfo));
          $('a.toggle-details', $panel).on('click', toggleDetails);
          $qListContainer.append($panel);
        });
      });
  }

  function filterQuestionList(ev) {
    var category = '';
    if (!ev) category = location.hash.substr(1);
    else category = ev.currentTarget.href.split('#')[1];
    category = category.trim();

    if (!category.match(/^[\w\d]+$/)) {
      $('#qList .panel').show(500);
      $('#category li').removeClass('active');
      $('#category li[data-category="All"]').addClass('active');
    } else {
      $('#qList .panel[data-category="' + category + '"]').show(500);
      $('#qList .panel[data-category!="' + category + '"]').hide(500);
      $('#category li').removeClass('active');
      $('#category li[data-category="' + category + '"]').addClass('active');
    }
  }

  function formSettings() {
    $('form').on('submit', function(ev) {
      ev.preventDefault();
    });
    $('#qList .panel form').on('submit', submitFlag);
    $('#login button').on('click', login);
    $('#logout button').on('click', logout);
  }

  function submitFlag(ev) {
    var $target = $(ev.currentTarget);
    var $parent = $target.parent();
    $('.alert', $parent).hide(250);

    var flag = $('input', $target).val().trim();
    $('input', $target).val('');

    return fetch('./api/submit', {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: $target.data('question'),
        flag: flag
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.status !== 'ok') {
        $('.alert-warning', $parent).text(json.message).show(250);
      } else {
        $('.alert-info', $parent).text(json.message || 'Success!!').show(250);
      }
    })
    .then(loadUserInfo);
  }

  function login(ev) {
    var action = $(ev.currentTarget).data('action');
    var $loginForm = $('form#login');
    var query = $loginForm.serializeJson();

    var opts = {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    };

    var promise = (action === 'signup') ?
      fetch('./api/signup', opts)
        .then(function(res) { return res.json(); })
        .then(function(json) { if (json.status !== 'ok') throw json; }) :
      Promise.resolve();

    return promise.then(function() {
      return fetch('./api/auth', opts);
    })
    .then(function(res) { return res.json(); })
    .then(function(json) { if (json.status !== 'ok') throw json; })
    .then(loadUserInfo)
    .catch(function(json) {
      alert(json.message);
    });
  }

  function loadUserInfo() {
    return fetch('./api/user', {
      credentials: 'same-origin'
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.status === 'ok') {
        userInfo = json.user;
        $('#userStatus').text(userInfo.username + '(' + userInfo.score + 'pts)');
        $('#login').hide(0);
        $('#logout').show(0);
      } else {
        throw new Error(json.message);
      }
    })
    .then(loadSubmitted);
  }

  function logout() {
    return fetch('./api/logout', {
      credentials: 'same-origin'
    }).then(function() {
      $('#userStatus').text('');
      $('#login').show(0);
      $('#logout').hide(0);
      $('.panel .label-info').hide(0);
      userInfo = {};
    })
    .then(loadUserInfo);
  }

  function loadSubmitted() {
    return fetch('./api/scores', {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userInfo.username
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.status !== 'ok') return;
      $('.panel .label-info').hide(0);
      json.scores.forEach(function(sInfo) {
        $('.panel[data-question="' + sInfo.question + '"]')
          .find('.label-info').show(0);
      });
    });
  }

  function toggleDetails(ev) {
    ev.preventDefault();

    var $target = $(ev.currentTarget);
    var question = $target.data('question');
    var $details = $('.panel[data-question="' + question + '"] .details');
    if (!$details.isVisible()) {
      fetch('/' + question + '/README.md')
        .then(function(res) { return res.text(); })
        .then(function(md) {
          var renderer = new marked.Renderer();
          (function() {
            var link = renderer.link.bind(renderer);
            renderer.link = function(href, title, text) {
              if (!href.match(/^http/)) href = '/' + question + '/' + href;
              return link(href, title, text);
            };
            var image = renderer.image.bind(renderer);
            renderer.image = function(href, title, text) {
              if (!href.match(/^http/)) href = '/' + question + '/' + href;
              return image(href, title, text);
            };
          })();
          $details.html(marked(md + '\n\n----', { renderer: renderer }));
          $('a', $details).attr({ target: '_blank' });
        })
        .then(function() {
          return fetch('./api/scores', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: question
            })
          })
          .then(function(res) { return res.json(); });
        })
        .then(function(json) {
          if (json.status === 'ok') {
            $details.append($('<p>').text(json.scores.length + ' users submitted.'));
          }
          $details.show(500);
        });
    } else {
      $details.hide(500);
    }
  }

});
