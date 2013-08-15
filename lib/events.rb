class Events 

  include Enumerable

  attr_reader :index, :columns, :start_timestamp, :end_timestamp

  def each &block
    @events.each &block
  end

  def filter! primary_dim, filter_label, only
    @events.select! do | event |
      (only && event[primary_dim] == filter_label) ||
        (!only && event[primary_dim] != filter_label)
    end
  end

  def size
    @events.size
  end

  def initialize(data)
    @events = []
    @index = {}
    @columns = []
    # for v2 data, we don't need to move timestamps to the start of the transaction
    ajust_start = false
    raise "Empty data not allowed" if data.nil? || data.empty?
    first_row = data.first
    # If all columns are strings this is a header row
    if first_row.reject{|col| col.is_a? String}.empty?
      header = data.shift
    else
      adjust_start = true
      header = %w[timestamp unused transaction frontend backend]
    end
    header.each_with_index do |col, i| 
      col = col.to_sym
      @index[col] = i
      @columns[i] = col
    end
    timestamp_index = @index[:timestamp]
    earliest_timestamp = data.inject{ | e, min | e[timestamp_index] < min[timestamp_index] ? e : min }[timestamp_index]
    @event_class = Struct.new(*columns)
    data.each do | rec | 
      event = @event_class.new(*rec) 
      if adjust_start
        event.timestamp -= [event.frontend, event.backend].compact.max 
        # Skip the event if adjusting the timestamp puts it starting earlier
        # than one second before the earliest event
        next if event.timestamp < earliest_timestamp - 1000
      end
      @events << event 
    end
    @events.sort_by! &:timestamp
    @start_timestamp = @events.first.timestamp
    @end_timestamp = @events.last.timestamp
  end

  def to_json
    s = StringIO.new
    s << "[\n"
    s << "#{self.columns.to_json},\n"
    @events.each_with_index do | event, i | 
      s << event.to_a.to_json
      s << "," if i < @events.size - 1
      s << "\n"
    end
    s << "]"
    s.string
  end
  
end
