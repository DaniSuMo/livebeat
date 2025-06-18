require "test_helper"

class ScheduledEventsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get scheduled_events_index_url
    assert_response :success
  end

  test "should get new" do
    get scheduled_events_new_url
    assert_response :success
  end

  test "should get create" do
    get scheduled_events_create_url
    assert_response :success
  end

  test "should get show" do
    get scheduled_events_show_url
    assert_response :success
  end

  test "should get edit" do
    get scheduled_events_edit_url
    assert_response :success
  end

  test "should get update" do
    get scheduled_events_update_url
    assert_response :success
  end

  test "should get destroy" do
    get scheduled_events_destroy_url
    assert_response :success
  end
end
