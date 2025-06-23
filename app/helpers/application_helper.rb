module ApplicationHelper
  def event_categories
    ScheduledEvent.categories
  end
end
