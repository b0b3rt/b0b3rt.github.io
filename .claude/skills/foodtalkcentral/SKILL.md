---
name: foodtalkcentral
description: Fetches and compiles restaurant reviews from FoodTalkCentral (FTC), a Discourse-based food forum. Use when the user asks about something that might require fetching content from FTC.
allowed-tools: WebFetch, Read, Write, Edit
---

# FoodTalkCentral (Discourse) API Guide

FoodTalkCentral is a Discourse-based forum at `foodtalkcentral.com`. This skill covers how to extract user posts and restaurant reviews.

## Key API Endpoints

### 1. User Profile
```
https://www.foodtalkcentral.com/u/{username}.json
```
Returns user metadata including post counts, badges, and activity dates.

### 2. User Actions (Posts/Replies)
```
https://www.foodtalkcentral.com/user_actions.json?username={username}&filter=5&offset={offset}
```
- `filter=5` returns replies/posts by the user
- `filter=4` returns topics started by the user
- `offset` for pagination (0, 50, 100, etc.)
- Returns post excerpts, topic titles, dates, and category info

### 3. Search for User Posts
```
https://www.foodtalkcentral.com/search.json?q=@{username} {search_terms}
https://www.foodtalkcentral.com/search.json?q=@{username} category:{category_id}
```
- More reliable for finding specific user posts than browsing user_actions
- Can filter by category (e.g., `category:5` for SF Bay Area)
- Returns post IDs, excerpts, and topic info

### 4. Topic/Thread JSON
```
https://www.foodtalkcentral.com/t/{topic-slug}/{topic-id}.json
https://www.foodtalkcentral.com/t/{topic-slug}/{topic-id}/{post-number}.json
```
- Returns full post content and participant info
- For long threads, append `/{post-number}` to load posts around that number
- Use to find specific post numbers for a user

### 5. Search for Topics
```
https://www.foodtalkcentral.com/search.json?q={restaurant_name}
```
Returns matching topics with their IDs and slugs.

### 6. Categories
```
https://www.foodtalkcentral.com/categories.json
```
Key category IDs:
- `5` = SF Bay Area / Northern California
- `6` = Los Angeles Area
- `24` = USA West (parent category)

## URL Patterns for Human-Readable Links

### Link to a thread:
```
https://www.foodtalkcentral.com/t/{topic-slug}/{topic-id}
```

### Link to a specific post in a thread:
```
https://www.foodtalkcentral.com/t/{topic-slug}/{topic-id}/{post-number}
```

Example: `https://www.foodtalkcentral.com/t/commis-oakland/15390/1`

## Workflow: Extracting a User's Restaurant Reviews

### Step 1: Get user overview
```
WebFetch: https://www.foodtalkcentral.com/u/{username}.json
```

### Step 2: Get user's posts with pagination
```
WebFetch: https://www.foodtalkcentral.com/user_actions.json?username={username}&filter=5&offset=0
WebFetch: https://www.foodtalkcentral.com/user_actions.json?username={username}&filter=5&offset=50
... continue until no more results
```

### Step 3: For each restaurant, find the topic URL
```
WebFetch: https://www.foodtalkcentral.com/search.json?q={restaurant_name}
```
Extract `topic_id` and `slug` from results.

### Step 4: Find user's specific post number in the thread
```
WebFetch: https://www.foodtalkcentral.com/t/{slug}/{topic_id}.json
```
Look for posts where `user_id` matches the target user (e.g., user ID 631 for t3t).

### Step 5: Get detailed post content
```
WebFetch: https://www.foodtalkcentral.com/t/{slug}/{topic_id}/{post_number}.json
```

## Common Issues & Solutions

### 404 Errors on Topic URLs
Topic slugs can be complex. Use the search API to find the correct slug:
```
WebFetch: https://www.foodtalkcentral.com/search.json?q={restaurant_name} {location}
```
The response includes the correct `slug` and `topic_id`.

### User Posts Not in First Batch
Thread JSON only returns ~20 posts initially. For long threads:
- Check `participants` array for user's post count
- Fetch thread at different offsets: `/t/{slug}/{id}/25.json`, `/t/{slug}/{id}/50.json`

### Rate Limiting (429 Errors)
The API may rate limit after many requests. Wait a few seconds between batches.

### Posts in Different Thread Versions
Some restaurants have multiple threads (e.g., "San Ho Won" vs "San Ho Won - Mission"). Search for both and check which contains the user's posts.

## Example: Finding a User's Review with Direct Link

```python
# 1. Search for the restaurant topic
search_url = "https://www.foodtalkcentral.com/search.json?q=commis oakland"
# Returns: topic_id=15390, slug="commis-oakland"

# 2. Get the thread to find post numbers
thread_url = "https://www.foodtalkcentral.com/t/commis-oakland/15390.json"
# Look in post_stream.posts for user_id matching target user
# Found: user t3t has posts 1, 6, 9

# 3. Construct direct link
direct_link = "https://www.foodtalkcentral.com/t/commis-oakland/15390/1"
```

## User ID Reference

When searching for a specific user's posts in thread JSON, look for their `user_id` in the posts array:
- User IDs are numeric (e.g., 631 for user "t3t")
- The user ID can be found in the `/u/{username}.json` response

## Output Format

When compiling reviews, include:
- Restaurant name and location
- Price tier ($, $$, $$$, $$$$)
- Cuisine type
- Exceptional items (dishes to order)
- Items to skip
- Notes/overall assessment
- Direct link to the user's FTC post(s)