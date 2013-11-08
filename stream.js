var ActivityStream = require('activity-stream');
var htmlToText = require('html-to-text');
var moment = require('moment');

activityStream = new ActivityStream('livefyre.com');

activityStream.on('error', function (err) {
    console.log('ActivityStream error', err);
})

activityStream.on('end', function () {
    console.log('\nActivityStream ended', arguments);
});

activityStream.on('data', function (state) {
    printState(state);
});

/**
 * Ghetto formatting
 */
function printState(state) {
    if ( ! state) return;
    var author = state.author;
    var authorName = author && author.displayName;
    var content = state.content;
    var contentBody = content && content.bodyHtml;

    if ( state.vis !== state.lastVis &&
       ! (state.vis===1 && state.lastVis===0)) {
        printModeration(state);
        return;
    }

    if ( ! (authorName && contentBody)) {
        process.stdout.write('_ ');
        console.log('NO CONTENT BODY\n')
        console.log(state);
        return;
    }

    console.log('\n');

    try {
        var contentBodyPlain = htmlToText.fromString(contentBody, {
            wordwrap: 80
        });
    } catch (e) {
        return;
    }

    var date = new Date(state.event/1000);
    console.log(moment(date).format('h:mma, D MMM')+'\n')

    console.log('@'+authorName+': ');
    console.log(contentBodyPlain);

    console.log('\nin "'+state.collection.title+'"')
    console.log('url: '+state.collection.url);
    process.stdout.write('\n--------- ');
}

function printModeration(state) {
    var contentId = state.content.id;
    console.log('\nModeration '+contentId);
    console.log('vis: '+state.lastVis + ' -> ' +state.vis);
    console.log('\n--------- ');
}