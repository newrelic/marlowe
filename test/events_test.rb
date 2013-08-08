require File.expand_path('../test_helper.rb', __FILE__)

describe Events do

  describe 'v1' do
    before do
      data = JSON.parse File.read(File.expand_path("../../data/testdata.json", __FILE__))
      @events = Events.new data
    end
    it "should have a valid index" do
      @events.index.size.should == 5
      @events.index[:transaction].should == 2
    end
    it "should enumerate all events" do
      count = 0
      @events.each do |event| 
        count += 1
        event.timestamp.to_i.should > 0
        event.transaction.length.should > 0
        event.frontend.should > 0
        event.backend.should > 0
      end
      count.should == @events.size
      count.should == 601
    end
    it "should stream back raw data" do
      @events.to_json
    end
  end
  describe 'v2' do
    before do
      data = JSON.parse File.read(File.expand_path("../../data/testdata_v2.json", __FILE__))
      @events = Events.new data
    end
    it "should have a valid index" do
      @events.index.size.should == 5
      @events.index[:transaction].should == 3
    end
    it "should enumerate all events" do
      count = 0
      @events.each do |event| 
        count += 1
        event.timestamp.to_i.should > 0
        event.transaction.length.should > 0
        event.frontend.should > 0
        event.backend.should > 0
      end
      count.should == @events.size
      count.should == 301
    end
  end
end
