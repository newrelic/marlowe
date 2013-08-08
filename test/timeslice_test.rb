require File.expand_path('../test_helper.rb', __FILE__)

describe Timeslice do
  # Load the timeslice with the testdata which has values: 100, 200, 400, 800, 1000
  # The testdata file is in the same format as the other raw data files
  before do
    @timeslice = Timeslice.new(0, 1000, apdex_t: 200, primary_attr: :backend)
    json = JSON.parse File.read(File.expand_path "../../data/testdata.json", __FILE__)
    events = Events.new json
    events.each { |record| @timeslice << record }
  end

  it "should calculate values" do
    @timeslice.record[:mean].should == 1522
    @timeslice.record[:stddev].to_i.should == 868
    @timeslice.record[:g_mean].to_i.should == 1153
    @timeslice.record[:g_stddev].round(2).should == 2.46
    @timeslice.record[:median].should == 1500
    @timeslice.record[:min].should == 50
    @timeslice.record[:max].should == 3000
    @timeslice.record[:apdex_t].should == 120
    @timeslice.record[:apdex_f].should == 450
    @timeslice.record[:apdex].should == 0.15
    @timeslice.record[:rpm].should == 36060
  end
  it "should calculate median for event values" do
    @timeslice = Timeslice.new(0, 1000, value_index: 0)
    @timeslice << { backend: 0, transaction: 'x' }
    @timeslice << { backend: 3, transaction: 'x' }
    @timeslice << { backend: 5,transaction: 'x' }
    @timeslice << { backend: 11,transaction: 'x' }
    # This isn't precisely the median, which should be 4, but 
    # it's sufficient for the data we are analyzing.
    @timeslice.record[:median].should == 5
  end

end
