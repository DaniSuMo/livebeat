require "test_helper"

class ScheduledEventTest < ActiveSupport::TestCase
  def setup
    @venue = venues(:one)
    @event = ScheduledEvent.new(
      title: "Test Event",
      location: "Test Location",
      category: "Test Category",
      starting_time: 1.day.from_now,
      ending_time: 2.days.from_now,
      price: 25.0,
      capacity: 100,
      venue: @venue
    )
  end

  test "should be valid with valid attributes" do
    # Attach test photos
    @event.photos.attach(
      io: File.open(Rails.root.join("test", "fixtures", "files", "test_image1.jpg")),
      filename: "test_image1.jpg",
      content_type: "image/jpeg"
    )
    @event.photos.attach(
      io: File.open(Rails.root.join("test", "fixtures", "files", "test_image2.png")),
      filename: "test_image2.png",
      content_type: "image/png"
    )

    assert @event.valid?
  end

  test "should require at least 2 photos" do
    @event.photos.attach(
      io: File.open(Rails.root.join("test", "fixtures", "files", "test_image1.jpg")),
      filename: "test_image1.jpg",
      content_type: "image/jpeg"
    )

    assert_not @event.valid?
    assert_includes @event.errors[:photos], "must have between 2 and 6 photos"
  end

  test "should not allow more than 6 photos" do
    7.times do |i|
      @event.photos.attach(
        io: File.open(Rails.root.join("test", "fixtures", "files", "test_image1.jpg")),
        filename: "test_image#{i}.jpg",
        content_type: "image/jpeg"
      )
    end

    assert_not @event.valid?
    assert_includes @event.errors[:photos], "must have between 2 and 6 photos"
  end

  test "should accept valid image formats" do
    @event.photos.attach(
      io: File.open(Rails.root.join("test", "fixtures", "files", "test_image1.jpg")),
      filename: "test_image1.jpg",
      content_type: "image/jpeg"
    )
    @event.photos.attach(
      io: File.open(Rails.root.join("test", "fixtures", "files", "test_image2.png")),
      filename: "test_image2.png",
      content_type: "image/png"
    )

    assert @event.valid?
  end

  test "should reject invalid file formats" do
    @event.photos.attach(
      io: File.open(Rails.root.join("test", "fixtures", "files", "test_image1.jpg")),
      filename: "test_image1.jpg",
      content_type: "image/jpeg"
    )
    @event.photos.attach(
      io: StringIO.new("not an image"),
      filename: "test.txt",
      content_type: "text/plain"
    )

    assert_not @event.valid?
    assert_includes @event.errors[:photos], "must be a JPEG, PNG, JPG, or GIF"
  end

  test "should reject files larger than 5MB" do
    # Create a mock large file
    large_file = StringIO.new("x" * (6 * 1024 * 1024)) # 6MB

    @event.photos.attach(
      io: File.open(Rails.root.join("test", "fixtures", "files", "test_image1.jpg")),
      filename: "test_image1.jpg",
      content_type: "image/jpeg"
    )
    @event.photos.attach(
      io: large_file,
      filename: "large_image.jpg",
      content_type: "image/jpeg"
    )

    assert_not @event.valid?
    assert_includes @event.errors[:photos], "must be less than 5MB each"
  end
end
