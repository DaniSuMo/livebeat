require "test_helper"

class UserTest < ActiveSupport::TestCase
  def setup
    @valid_user = User.new(
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      user_type: "user",
      phone_number: "1234567890",
      address: "123 Main Street, City, State 12345",
      date_of_birth: 25.years.ago,
      password: "password123",
      password_confirmation: "password123"
    )
  end

  test "should be valid with valid attributes" do
    assert @valid_user.valid?
  end

  test "should require first_name" do
    @valid_user.first_name = nil
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:first_name], "can't be blank"
  end

  test "should require last_name" do
    @valid_user.last_name = nil
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:last_name], "can't be blank"
  end

  test "should require email" do
    @valid_user.email = nil
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:email], "can't be blank"
  end

  test "should require unique email" do
    @valid_user.save!
    duplicate_user = @valid_user.dup
    duplicate_user.email = @valid_user.email.upcase
    assert_not duplicate_user.valid?
    assert_includes duplicate_user.errors[:email], "has already been taken"
  end

  test "should validate email format" do
    invalid_emails = ["invalid", "invalid@", "@invalid.com", "invalid@.com", "invalid@com"]
    invalid_emails.each do |email|
      @valid_user.email = email
      assert_not @valid_user.valid?, "#{email} should be invalid"
      assert_includes @valid_user.errors[:email], "must be a valid email address (e.g. user@example.com)"
    end
  end

  test "should accept valid email formats" do
    valid_emails = ["test@example.com", "user.name@domain.co.uk", "user+tag@example.org"]
    valid_emails.each do |email|
      @valid_user.email = email
      assert @valid_user.valid?, "#{email} should be valid"
    end
  end

  test "should require user_type" do
    @valid_user.user_type = nil
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:user_type], "can't be blank"
  end

  test "should validate user_type inclusion" do
    @valid_user.user_type = "invalid_type"
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:user_type], "must be either 'user' or 'venue'"
  end

  test "should accept valid user_types" do
    User::USER_TYPES.each do |user_type|
      @valid_user.user_type = user_type
      assert @valid_user.valid?, "#{user_type} should be valid"
    end
  end

  test "should require phone_number" do
    @valid_user.phone_number = nil
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:phone_number], "can't be blank"
  end

  test "should validate phone_number format" do
    invalid_phones = ["123", "abc", "123-456"]
    invalid_phones.each do |phone|
      @valid_user.phone_number = phone
      assert_not @valid_user.valid?, "#{phone} should be invalid"
      assert_includes @valid_user.errors[:phone_number], "must be a valid phone number"
    end
  end

  test "should accept valid phone_number formats" do
    valid_phones = ["1234567890", "+1-234-567-8900", "(123) 456-7890", "123 456 7890"]
    valid_phones.each do |phone|
      @valid_user.phone_number = phone
      assert @valid_user.valid?, "#{phone} should be valid"
    end
  end

  test "should require address" do
    @valid_user.address = nil
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:address], "can't be blank"
  end

  test "should validate address length" do
    @valid_user.address = "Short"
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:address], "is too short (minimum is 10 characters)"

    @valid_user.address = "A" * 201
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:address], "is too long (maximum is 200 characters)"
  end

  test "should require date_of_birth" do
    @valid_user.date_of_birth = nil
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:date_of_birth], "can't be blank"
  end

  test "should not allow future date_of_birth" do
    @valid_user.date_of_birth = 1.day.from_now
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:date_of_birth], "cannot be in the future"
  end

  test "should require user to be at least 18 years old" do
    @valid_user.date_of_birth = 17.years.ago
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:date_of_birth], "user must be at least 18 years old"
  end

  test "should allow user who is exactly 18 years old" do
    @valid_user.date_of_birth = 18.years.ago
    assert @valid_user.valid?
  end

  test "should validate first_name length" do
    @valid_user.first_name = "A"
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:first_name], "is too short (minimum is 2 characters)"

    @valid_user.first_name = "A" * 51
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:first_name], "is too long (maximum is 50 characters)"
  end

  test "should validate last_name length" do
    @valid_user.last_name = "A"
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:last_name], "is too short (minimum is 2 characters)"

    @valid_user.last_name = "A" * 51
    assert_not @valid_user.valid?
    assert_includes @valid_user.errors[:last_name], "is too long (maximum is 50 characters)"
  end

  test "full_name should return concatenated name" do
    @valid_user.first_name = "John"
    @valid_user.last_name = "Doe"
    assert_equal "John Doe", @valid_user.full_name
  end

  test "user? should return true for user type" do
    @valid_user.user_type = "user"
    assert @valid_user.user?
    assert_not @valid_user.venue?
  end

  test "venue? should return true for venue type" do
    @valid_user.user_type = "venue"
    assert @valid_user.venue?
    assert_not @valid_user.user?
  end

  test "user_type_display should return correct display name" do
    @valid_user.user_type = "user"
    assert_equal "Music Lover", @valid_user.user_type_display

    @valid_user.user_type = "venue"
    assert_equal "Venue Owner", @valid_user.user_type_display
  end

  test "user_type_description should return correct description" do
    @valid_user.user_type = "user"
    assert_equal "Find and attend events", @valid_user.user_type_description

    @valid_user.user_type = "venue"
    assert_equal "Host and manage events", @valid_user.user_type_description
  end

  test "age should calculate correct age" do
    @valid_user.date_of_birth = 25.years.ago
    assert_equal 25, @valid_user.age
  end

  test "age should return nil if date_of_birth is nil" do
    @valid_user.date_of_birth = nil
    assert_nil @valid_user.age
  end
end
