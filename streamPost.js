/**
 * Dependencies.
 */
var ActivityStream = require('./lib/activity-stream');
var request = require('request');

/**
 * Options.
 */
var opts = {
    network  : '',
    site     : '',
    secret   : '',
    api_urn  : '',
    _timeout : 5000,
    authorizationHeader : null // if you pass a token, you don't have to pass a secret
};

/**
 * Stream.
 */
activityStream = new ActivityStream('livefyre.com', opts);

activityStream.on('error', function (err) {
    console.log('ActivityStream error', err);
})

activityStream.on('end', function () {
    console.log('\nActivityStream ended', arguments);
});

activityStream.on('close', function () {
    console.log('\nActivityStream closed', arguments);
});

activityStream.on('data', function (data) {
  if (data) {
    var opts = {
        uri    : 'http://requestb.in/1l61kox1',
        method : 'POST',
        json: data
    }
    request(opts, function(e, res, body) {
        if (e) console.error('Error while posting data : ', e, body);
    });
  }
});

/**
 * Stream to a POST endpoint.
 *
 * It doesn't work.
 * Neither : fs.createReadStream('test.json').pipe(request.post('http://requestb.in/1l61kox1'));
 */
// activityStream.pipe(request('http://requestb.in/1l61kox1'));
