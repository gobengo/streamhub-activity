'use strict';

var request = require('request');
var stream = require('stream');

module.exports = ActivityStream;

/**
 * ActivityStream
 * A Stream of StreamHub Network social Activities
 */
function ActivityStream (topic, opts) {
    opts = opts || {};
    this.topicType = 'network';
    this.topic = topic;
    this._timeout = opts.timeout || 5000;
    this._cursor = {};
    opts.objectMode = true;
    stream.Readable.call(this, opts);
}

ActivityStream.prototype = Object.create(stream.Readable.prototype);

ActivityStream.prototype._read = function () {
    var nextSince = this._cursor.next;
    var oneHour = 1000 * 60 * 60 * 10;
    var qs = {
        since: nextSince || (Number(new Date()) * 1000) - oneHour
    };

    process.stdout.write('req('+qs.since+') ');
    request({
        url: 'http://bootstrap.livefyre.com/api/v3.1/activity/network/livefyre.com/',
        qs: qs,
        json: true
    }, function (error, response, body) {
        if (error) {
            this.emit('error', error);
            return;
        }
        var lastSince = qs.since;
        this._cursor = body.meta.cursor;
        if (this._cursor.next === null) {
            this._cursor.next = lastSince + this._timeout;
        }
        var states = activitiesToStates(body.data);

        if (states.length) {
            this.push.apply(this, states);
            return;
        }
        // Try again in this._timeout
        process.stdout.write('wait('+this._timeout/1000+') ');

        setTimeout(function () {
            this.push('');
        }.bind(this), this._timeout);
        
    }.bind(this));
};

/**
 * Convert the activities summary object to an array
 * of denormalized states with .author and .collection
 */
function activitiesToStates(activities) {
    var states = Object.keys(activities.states).map(function (stateId) {
        var state = activities.states[stateId];
        state.collection = activities.collections[state.collectionId];
        state.author = activities.authors[state.content.authorId];
        return state;
    });
    return states;
}
