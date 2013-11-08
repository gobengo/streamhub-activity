'use strict';

require('chai').should();

var stream = require('stream');

var ActivityStream = require('activity-stream');

describe('ActivityStream', function () {
    var activityStream;
    beforeEach(function () {
        activityStream = new ActivityStream('livefyre.com');
    });
    afterEach(function () {
        activityStream.pause();
    });

    it('is a Readable', function () {
        activityStream.should.be.an
            .instanceOf(stream.Readable);
    });

    it('emits data', function (done) {
        activityStream.once('data', function (resp) {
            done();
        });
    });
});
