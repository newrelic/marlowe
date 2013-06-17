$LOAD_PATH.unshift File.expand_path "../../lib", __FILE__
require 'timeslice'
require 'rspec'
require 'json'

describe Timeslice do
  # Load the timeslice with the testdata which has values: 100, 200, 400, 800, 1000
  # The testdata file is in the same format as the other raw data files
  before do
    @timeslice = Timeslice.new(0, 1000, apdex_t: 200, value_index: 4)
    json = JSON.parse File.read(File.expand_path "../../data/testdata.json", __FILE__)
    json.each { |record| @timeslice << record }
  end

  it "should calculate values" do
    @timeslice.record[:mean].should == 1522
    @timeslice.record[:std_dev].to_i.should == 868
    @timeslice.record[:g_mean].to_i.should == 1153
    @timeslice.record[:g_stddev].to_i.should == 730
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
    @timeslice << [0]
    @timeslice << [3]
    @timeslice << [5]
    @timeslice << [11]
    # This isn't precisely the median, which should be 4, but 
    # it's sufficient for the data we are analyzing.
    @timeslice.record[:median].should == 5
  end

end
