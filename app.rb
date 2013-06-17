$LOAD_PATH.unshift File.expand_path "../lib", __FILE__
require 'sinatra'
require 'json'
require 'timeslice'

# This is a Sinatra app for handing data to the d3 visualizations.  It defines
# page actions for the different datasets needed by the d3 charts.

# Before any request, we load in the data and read the general
# parameters.  
before '/data/:type/:file' do |type, file|
  process_params
  content_type 'application/json'
  read_data
end  

get '/' do
  process_params
  read_data
  @files = Dir["data/*.json"].map{|name| name[%r{/(.*)$}, 1]}
  pages = {}
  File.open("data/#{@file}") do | io |
    while !io.eof? && l = io.readline
      l.chomp!
      if l =~ /(https?:\S*)/
        @url = $1
      elsif l =~ /^\s*\[(.*)\][,\s]*$/
        fields = $1.split(/["\s]*,["\s]*/)
        uri = fields[2]
        pages[uri] ||= 0
        pages[uri] += fields[3].to_i
      end
    end
  end
  @top10 = pages.to_a.sort_by{|name, val| -val}[0..9].map(&:first)
  haml :index
end

# DATA HANDLERS
# The remaining paths fetch the data files and apply the respective transformation
# and return the json

# Get the "measures of central tendency"
get '/data/aggregate/:file' do 
  JSON.pretty_generate timeseries_data
end

get '/data/treemap/:file' do
  flat_counts = []
  tree = refactorToTreemap 'root', tree_data, flat_counts
  # return a json with two parts: a tree structure and a flat list
  # of counts for each transaction type
  JSON.pretty_generate('tree' => tree, 'counts' => flat_counts.sort_by(&:last).reverse)
end

helpers do
  def process_params
    @value_index = (params[:value_index] ? params[:value_index].to_i : 4)
    @apdex_t = (params[:apdex_t] || 800).to_i
    @y_max = (params[:y_max] || 5000).to_i
    @density = (params[:density] || 60).to_i
    @filter_label = params[:filter] if params[:filter] && !params[:filter].empty?
    @only = @filter_label.nil? || params[:only] != "0"
    @file = params[:file] || params[:filename] || "nr-queuing-spike.json"
  end

  def read_data
    text = File.read("data/#{@file}")
    @data = JSON.parse text
    @data.select! do | rec |
      (@only && rec[2] == @filter_label) ||
        (!@only && rec[2] != @filter_label)
    end if @filter_label
  end

  # This generates a json object consisting of an array of Timeslice records.
  # Refer to the Timeslice#record method for details on what's in each timeslice.
  # At the front of the array is a Timeslice record representing the entire time
  # range.
  def timeseries_data
    histogram_bucket_count = @density - 1
    histogram_bucket_size = @y_max.to_f / histogram_bucket_count
    num_values = (params[:buckets] || @density * 4).to_i
    start_date = @data.first[0]
    end_date = @data.last[0]
    bucket_width = (end_date - start_date) / num_values
    buckets = []
    num_values.times do |i| 
      buckets[i] = Timeslice.new(start_date + i * bucket_width, 
                              bucket_width,
                              :histogram_bucket_size => histogram_bucket_size,
                              :histogram_bucket_count => histogram_bucket_count,
                              :value_index => @value_index, 
                              :apdex_t => @apdex_t)

    end
    summary = Timeslice.new(start_date, 
                         end_date - start_date,
                         :histogram_bucket_size => histogram_bucket_size,
                         :histogram_bucket_count => histogram_bucket_count,
                         :value_index => @value_index, 
                         :apdex_t => @apdex_t)

    @data.each do | vals |
      index = [(vals[0] - start_date) / bucket_width, num_values - 1].min.floor
      buckets[index] << vals
      summary << vals
    end
    # Put the series summary on the front
    buckets.unshift summary
    buckets.map { |b| b.record }
  end

  # Generate a json tree where the branches have children and the
  # leaves have accumulated stats. We accumulate stats in a ruby
  # friendly way then refactor the tree into d3.treemap format.
  def tree_data
    # column is a timeslice
    num_timeslices = (params[:buckets] || @density * 4).to_i
    start_date = @data.first[0]
    end_date = @data.last[0]
    timeslice_width = (end_date - start_date) / num_timeslices

    num_buckets = @density - 1
    bucket_width = @y_max.to_f / num_buckets
    flat_counts = {}
    nodes = {}
    @data.each do | vals |
      x = vals[0]
      # The timeslice bucket the value belongs in
      timeslice_index = [(x - start_date) / timeslice_width, num_timeslices - 1].min.floor
      # index =           [(vals[0] - start_date) / bucket_width,    num_values - 1].min.floor
      # the label
      k = vals[2]
      v = vals[@value_index].to_i
      # the histogram bucket the value belongs in
      bucket_index = [(v / bucket_width).to_i, num_buckets].min
      node = nodes
      k.split('/').each do |name|
        node = (node[name] ||= {})
      end
      stats = node["leaf stats"] ||= {"count" => 0, "time" => 0, "title" => k, "row" => [], "bars" => [], "map" => {}}
      stats["count"] += 1
      stats["time"] += v
      stats["row"][timeslice_index] ||= 0
      stats["row"][timeslice_index] += 1
      stats["bars"][bucket_index] ||= 0
      stats["bars"][bucket_index] += 1
      coord = "#{timeslice_index},#{bucket_index}"
      stats["map"][coord] ||= 0
      stats["map"][coord] += 1
      flat_counts[k] ||= 0
      flat_counts[k] += 1
    end
    nodes
  end

  # We need to go back through the treemap and make sure the name at each node consists
  # of the full "path" to the node.
  def refactorToTreemap (name, nodes, leaves = [])
    if (leaf = nodes["leaf stats"])
      leaf['name'] = name
      leaves << [ leaf["title"], leaf["count"] ]
      return leaf
    else
      children = nodes.keys.map{|key| refactorToTreemap key, nodes[key], leaves}
      return {'name' => name, 'children' => children}
    end
  end
end
