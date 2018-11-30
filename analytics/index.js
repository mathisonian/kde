var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');

var config = {
  apiKey: "AIzaSyDhicO25co-cxuhvOzDang4Ws_-lZFa_dU",
  authDomain: "interactive-analytics-cfc22.firebaseapp.com",
  databaseURL: "https://interactive-analytics-cfc22-kde.firebaseio.com/",
  projectId: "interactive-analytics-cfc22",
  storageBucket: "interactive-analytics-cfc22.appspot.com",
  messagingSenderId: "109430261621"
};


const FLUSH_INTERVAL = 2000;

/**
 * Called every `FLUSH_INTERVAL`ms,
 * this sends scroll data back to
 * the database.
 */
const getViewport = () => {
  let viewPortWidth;
  let viewPortHeight;

  // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
  if (typeof window.innerWidth != 'undefined') {
    viewPortWidth = window.innerWidth,
    viewPortHeight = window.innerHeight
  }

  // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
  else if (typeof document.documentElement != 'undefined'
  && typeof document.documentElement.clientWidth !=
  'undefined' && document.documentElement.clientWidth != 0) {
      viewPortWidth = document.documentElement.clientWidth,
      viewPortHeight = document.documentElement.clientHeight
  }

  // older versions of IE
  else {
    viewPortWidth = document.getElementsByTagName('body')[0].clientWidth,
    viewPortHeight = document.getElementsByTagName('body')[0].clientHeight
  }
  return [viewPortWidth, viewPortHeight];
}


class Analytics {

  flushData() {
    this.visitRef.child('timeOnPage').set(new Date() - this.startTime);
    if (this.scrolls.length) {
      this.visitRef.child(`scroll-positions/${this.scrollCount++}`).set(JSON.stringify(this.scrolls));
      this.scrolls = [];
    }
    // if (this.mousePositions.length) {
    //   this.visitRef.child(`mouse-positions/${this.mouseCount++}`).set(JSON.stringify(this.mousePositions));
    //   this.mousePositions = [];
    // }
  }

  updateState(newState) {
    this.visitRef.child(`state/${this.stateCount++}`).set(JSON.stringify(Object.assign({}, newState, {
      timestamp: new Date() - this.startTime
    })));
  }

  onLoad(cb) {
    this._onLoad = cb;
  }

  constructor(projectName) {
    this.startTime = new Date();
    this.scrolls = [];
    // this.mousePositions = [];
    this.scrollCount = 0;
    this.mouseCount = 0;
    this.stateCount = 0;

    // window.addEventListener('mousemove', (e) => {
    //   var t = new Date();
    //   var diff = t - this.startTime;
    //   var x = e.pageX;
    //   var y = e.pageY;
    //   this.mousePositions.push([ diff, x, y ]);
    // });

    var doc = document.documentElement;
    window.addEventListener("scroll", () => {
      var t = new Date();
      var diff = t - this.startTime;

      // var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
      var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
      this.scrolls.push([ diff, top ]);
    });

    var _navigator = {};
    for (var i in navigator) _navigator[i] = navigator[i];

    delete _navigator.plugins;
    delete _navigator.mimeTypes;
    delete _navigator.credentials;
    delete _navigator.clipboard;

    const userDetails = {
      location: window.location,
      viewport: getViewport(),
      navigator: _navigator,
      top: (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0)
    };

    firebase.initializeApp(config);

    firebase.auth().signInAnonymously().then(({user}) => {
      const userRef = firebase.database().ref(`${projectName}/users/${user.uid}`);

      userRef.child('visitCount').once('value').then((value) => {
        let v = value && value.toJSON ? value.toJSON() : 0;
        let visitCount = v + 1;
        userRef.child('visitCount').set(visitCount);
        userRef.child('details').set(JSON.stringify(userDetails))

        this.visitRef = userRef.child(`visits/${visitCount}`);
        // userRef.child(`visits`).set(''+startTime);
        this.visitRef.child('details').set(JSON.stringify(userDetails));
        this.visitRef.child('startTime').set(+this.startTime);

        setInterval(() => {
          this.flushData();
        }, FLUSH_INTERVAL);

        this._onLoad && this._onLoad();
      });

    });
  }
}


module.exports = Analytics;