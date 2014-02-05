'use strict';

/**
 * Dependencies.
 */
var request = require('request');
var stream = require('stream');
var jwt = require('jwt-simple');
var util = require('util');

module.exports = ActivityStream;

/**
 * ActivityStream
 * A Stream of StreamHub Network social Activities
 */
function ActivityStream (topic, opts) {
    opts = opts || {};
    this.topicType = 'network';
    this.topic = topic;
    this.network = opts.network;
    this.site = opts.site;
    this.secret = opts.secret;
    this.network_urn = "urn:livefyre:" + this.network;
    this.site_urn = (this.site) ? this.network_urn + ":site/" + this.site : this.network_urn;
    this.api_urn = opts.api_urn;
    this._timeout = opts.timeout || 5000;
    this._cursor = {};
    this.authorizationHeader = opts.authorizationHeader;
    opts.objectMode = true;
    stream.Readable.call(this, opts);
}

util.inherits(ActivityStream, stream.Readable);

ActivityStream.prototype.createAuthorization = function() {
    if (this.authorizationHeader)
        return this.authorizationHeader;

    var self = this;
    var payload = {
        iss : self.network_urn,
        aud : self.network_urn,
        sub : self.site_urn,
        exp : ( (new Date()).getTime()/1000 ) + 100,
        scope : self.api_urn
    };
    if (!self.site) {
        payload.sub = self.network_urn;
    }
    var token = 'Bearer ' + jwt.encode(payload, self.secret);
    return token;
}

ActivityStream.prototype._read = function () {
    var self = this;
    var nextSince = this._cursor.next;
    var oneHour = 1000 * 60 * 60 * 10;
    var qs = {
        since: nextSince || (Number(new Date()) * 1000) - oneHour*1000,
        resource: self.site_urn
    };

    process.stdout.write('req('+qs.since+') ');

    request({
        url: 'http://bootstrap.livefyre.com/api/v3.1/activity/',
        qs: qs,
        json: true,
        headers: {
            'Authorization' : self.createAuthorization()
        }
    }, function (error, response, body) {
        if (error) {
            console.log('error ? ', error);
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
            this.push(JSON.stringify(states));
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
