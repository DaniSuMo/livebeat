# Event Categories

LiveBeat now uses a fixed set of predefined categories for events. This ensures consistency and makes it easier for users to find events they're interested in.

## Available Categories

1. **Art & Culture** - Art exhibitions, cultural events, museums, galleries
2. **Live Music & Concerts** - Live performances, concerts, music festivals
3. **Nightlife & Parties** - Club events, parties, DJ nights
4. **Education & Workshops** - Classes, seminars, training sessions
5. **Sports & Wellness** - Fitness classes, sports events, wellness activities
6. **Family & Kids** - Family-friendly events, children's activities
7. **Food & Drinks** - Food festivals, wine tastings, cooking classes
8. **Business & Networking** - Professional events, networking meetups
9. **Technology & Gaming** - Tech meetups, gaming tournaments, hackathons
10. **Fashion & Shopping** - Fashion shows, shopping events, pop-up markets
11. **Sustainability & Environment** - Environmental awareness, green events
12. **Personal Growth & Spirituality** - Self-improvement, meditation, spiritual events

## Implementation Details

- Categories are defined as a constant in the `ScheduledEvent` model
- Form validation ensures only predefined categories are accepted
- A migration has been created to update any existing events with invalid categories
- Helper methods are available for easy access to categories in views

## Usage

### In Views
```erb
<%= form.select :category, event_categories, { prompt: "Select a category" } %>
```

### In Models
```ruby
ScheduledEvent.categories
# or
ScheduledEvent::EVENT_CATEGORIES
```

### Validation
The model automatically validates that only predefined categories are used:
```ruby
validates :category, inclusion: { in: EVENT_CATEGORIES }
```
