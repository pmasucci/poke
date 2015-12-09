// We will be using jQuery to manipulate DOM elements for the chat.
var $ = require('jquery');

// Manages the state of our access token we got from the server
var accessManager;

// Our interface to the IP Messaging service
var messagingClient;

// The object we are going to export as this module
module.exports = {
  printMessage: function(msg, by) {
    var p = $('<p>').text(msg);
    if (by) {
      p.prepend($('<span class="message-by">').text(by + ': '));
    } else {
      p.addClass('server');
    }
    $('.messages').append(p);
  },

  // Connect to the Twilio IP Messaging API and set up the chat app
  initializeChat: function(identity) {

    // Get an access token for the current user, passing a username (identity)
    // and a device ID - for browser-based apps, we'll always just use the
    // value "browser"
    $.getJSON('/token', {
      identity: identity,
      device: 'browser'
    }, function(data) {
      // Initialize the IP messaging client
      accessManager = new Twilio.AccessManager(data.token);
      messagingClient = new Twilio.IPMessaging.Client(accessManager);

      this.setupChannel();
    }.bind(this));
  },

  setupChannel: function() {
    // Get the general chat channel, which is where all the messages are
    // sent in this application
    var promise = messagingClient.getChannelByUniqueName('general');
    promise.then(function(channel) {
      this.channel = channel;
      if (!this.channel) {
        // If it doesn't exist, let's create it
        messagingClient.createChannel({
          uniqueName: 'general',
          friendlyName: 'General Chat Channel'
        }).then(function(channel) {
          this.channel = channel;
          this.setListeners();
        }.bind(this));
      } else {
        this.setListeners();
      }
    }.bind(this));
  },

  // Set up channel after it has been found
  setListeners: function() {
    var onMessageAdded = function(newMessage) {
      this.printMessage(newMessage.body, newMessage.author);
    }.bind(this);

    // Join the general channel
    this.channel.join().then(function(channel) {
      // Listen for new messages sent to the channel
      channel.on('messageAdded', onMessageAdded);
    });
  },

  // Function that will be called in order to join the chat with a given username.
  // This calls initializeChat after
  join: function(username) {
    $('body').addClass('joined');
    $('.input').addClass('joined');
    $('.input input').attr('placeholder', 'type in to chat').blur();

    // If the IP Messaging channel doesn't exist yet, initialize it.
    if(!this.channel) {
      this.initializeChat(username);
    }
  }
};
