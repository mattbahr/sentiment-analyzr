# Sentiment Analyzr

Sentiment Analyzr uses GPT to analyze the sentiment of any web page and responds with a detailed report which includes a neutralized summary of the page content. It works great on news articles, blog posts, social media threads, political cartoons, etc. It does not currently analyze video or audio data. While Sentiment Analyzr is free to install and use, you will need to supply your own OpenAI API key. Your key will be stored using Chrome's Storage API.

The prompt used to instruct the OpenAI assistant is located in the backend directory. It uses an example lifted from [this](https://apnews.com/article/noem-homeland-security-habeas-corpus-trump-338604206f40fed32c2790608d3e5da6) article by the Associated Press.
