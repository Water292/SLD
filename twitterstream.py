from pymongo import MongoClient
import tweepy
import json
import time
import sys
import os
import datetime
import socket
from pprint import pprint

db_client = MongoClient()
db_object = db_client.test

ACCESS_TOKEN = ''
ACCESS_SECRET = ''
CONSUMER_KEY = ''
CONSUMER_SECRET = ''

def collection(collection_name):
    return db_object[str(collection_name)]

i = 0
endTime = time.time() + 1


class StreamListener(tweepy.StreamListener):

    def on_status(self, tweet):
        if time.time() > endTime: 
            print("Over")
            return False
        type_str = ""
        tweet_reply_id=""
        tweet_reply_user=""
        
        if (not (tweet.retweeted or tweet.in_reply_to_screen_name or 
    	    tweet.in_reply_to_status_id or tweet.in_reply_to_user_id)): 
            type_str = "original"
        elif (tweet.retweeted):
            type_str = "retweet"
            tweet_reply_id = tweet.retweeted_status.id_str
            tweet_reply_user = tweet.retweeted_status.user.id_str
        else:
    	    type_str = "reply"
    	    tweet_reply_id=tweet.in_reply_to_status_id
    	    tweet_reply_user=tweet.in_reply_to_user_id
  
        tempkeywords = []
        tempchannels = []

        db_object.messages.insert_one({
            'user_id' : tweet.user.id_str,
            'tweet_id': tweet.id_str,
            'text' : tweet.text,
            'channels' : ['PythonTest'],
            'keywords' : ['Donald', 'Trump', 'Hillary', 'Clinton'],
            'type': type_str,
            'in_reply_to_tweet_id': tweet_reply_id,
            'in_reply_to_user_id': tweet_reply_user,
            'created_at': tweet.created_at,
            'lang': tweet.lang,
            'quoted_status_id': getattr(tweet, 'quoted_status_id_str', ""),
            'timeCollected': datetime.datetime.now()
        })

        global i 
        i += 1
        # if i % 1000 == 0: print(i)
        print(i)

    def on_error(self, status_code):
        raise tweepy.error.TweepError(status_code)

class ErrorHandler(object):
    """Handles errors raised by the Twitter Streaming API.
 
This class contains methods to handle various types of errors that
may occur while connecting to the Streaming API. Each method
sleeps, logs the error, and increments the error count. The sleep
durations and error count are reset if the last error occurred more
than 60 minutes ago.
 
See also: https://dev.twitter.com/docs/streaming-apis/connecting
 
Attributes:
sleep_{rate_limit, http_error, network_error, db_error}:
Seconds to sleep before retrying the API connection.
error_count: Number of errors that have occurred.
time_of_last_error: The Unix time when the last error occurred.
"""
 
    def __init__(self):
        """Initializes class with default parameter values."""
        self._reset()
 
    def _reset(self):
        """Reset class parameters to default values."""
        self.sleep_rate_limit = 60
        self.sleep_http_error = 5
        self.sleep_network_error = .25
        self.sleep_db_error = .25
        self.error_count = 0
        self.time_of_last_error = time.time()
 
    def _decorator(func):
        """Reset (if necessary) and increment class parameters."""
        def wrapper(self, *args):
            if time.time() - self.time_of_last_error > 60 * 60:
                self._reset() # No errors occured in the past 60 minutes.
            func(self, *args)
            self.error_count += 1
            self.time_of_last_error = time.time()
        return wrapper
 
    @_decorator
    def rate_limit(self, status_code):
        msg = 'HTTP error, status code {}. Retrying in {} seconds.'
        msg = msg.format(status_code, self.sleep_rate_limit)
        time.sleep(self.sleep_rate_limit)
        self.sleep_rate_limit *= 2
 
    @_decorator
    def http_error(self, status_code):
        msg = 'HTTP error, status code {}. Retrying in {} seconds.'
        msg = msg.format(status_code, self.sleep_http_error)
        time.sleep(self.sleep_http_error)
        self.sleep_http_error = min(self.sleep_http_error * 2, 320)
 
    @_decorator
    def network_error(self):
        msg = 'TCP/IP error. Retrying in {} seconds.'
        msg = msg.format(self.sleep_network_error)
        time.sleep(self.sleep_network_error)
        self.sleep_network_error = min(self.sleep_network_error + 1, 16)
 
    @_decorator
    def db_error(self):
        msg = 'Database error. Retrying in {} seconds.'
        msg = msg.format(self.sleep_db_error)
        time.sleep(self.sleep_db_error) # Sleep time remains constant.

if __name__ == '__main__':
    l = StreamListener()
    auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
    auth.set_access_token(ACCESS_TOKEN, ACCESS_SECRET)
    error_handler = ErrorHandler()
    def streamTweets():
        while time.time() < endTime:
            print("here")
            try:
                print("try here")
                stream = tweepy.Stream(auth, l, 
                    wait_on_rate_limit_notify = True)
                stream.filter(track=['Trump', 'Clinton'])
            except KeyboardInterrupt: 
                break
            except Exception as e:
                print(e)
                if error_handler.error_count > 10:
                    break
                if (isinstance(e, tweepy.error.TweepError) and 
                    (e.args[0] == 420 or e.args[0] >= 500)):
                    error_handler.rate_limit(e.args[0])
                elif isinstance(e, tweepy.error.TweepError):
                    error_handler.http_error(e.args[0])
                elif isinstance(e, socket.error):
                    error_handler.network_error()
                # elif isinstance(e, MySQLdb.MySQLError):
                #     error_handler.db_error()
                else:
                    break
    streamTweets()
    db_client.close()
