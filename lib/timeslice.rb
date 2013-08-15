# A timeslice represents an aggregation of data over some interval.
# It calculates a number of different aggregate values like mean,
# median, min, max, and can be used to plot a mean across a time
# range, or to draw summary bars representing those values in a full
# data set.  It also includes an array of buckets used for drawing a
# histogram for just this timeslice.
#
# Study the #record method and unit tests for a clear definition
# of what is in a Timeslice.

class Timeslice

  # In the raw data, value at col 4 is the app response time
  # value at column 3 is the enduser response time
  # - timestamp is ms time since UTC epoch
  # - duration is duration of the timeslice in milliseconds
  def initialize(timestamp, duration, opts = {})
    @breakdown = {}
    @timestamp = timestamp
    @duration = duration
    @measure = opts[:measure] || :backend
    @histogram_bucket_count = opts[:histogram_bucket_count]
    @histogram_bucket_size =  opts[:histogram_bucket_size]
    @t = (opts[:apdex_t] || 500).to_f
    @values = []
    @log_transform = opts[:log_transform]
    @apdex_f = @apdex_t = @total = @sum_of_squares = @sum_of_log_squares = @sum_of_logs = 0
    if @histogram_bucket_size
      @histogram_bucket_count ||= 10000 / @histogram_bucket_size
      @histogram_buckets = [0] * (@histogram_bucket_count + 1)
    end
    @primary_dim = opts[:primary_dim] || :transaction
  end

  # There's an anomaly in some of the data where the value is zero.
  # We're going to treat zero as absent
  def add(event) 
    v = event[@measure]
    return if v.zero?
    if @log_transform
      v = 500 * Math.log(v)
    end
    @values << v
    @min = v if @min.nil? || @min > v
    @max = v if @max.nil? || @max < v
    if @t 
      case
        when v >= @t * 4 then @apdex_f += 1
        when v >= @t then @apdex_t += 1
      end
    end
    @total += v
    @sum_of_squares += v**2
    l = (v == 0 ? 0 : Math.log(v))
    @sum_of_logs += l
    @sum_of_log_squares += l**2
    if @histogram_buckets
      @histogram_buckets[[(v / @histogram_bucket_size).to_i, @histogram_bucket_count].min] += 1
    end

    # Transaction name, or other dimension:
    label = event[@primary_dim]
    @breakdown[label] ||= [0, 0]
    @breakdown[label][0] += 1
    @breakdown[label][1] += v
  end

  alias :"<<" :add

  def empty?
    @values.size == 0
  end

  def record
    return {
      time: @timestamp,
      count: @values.size,
      rpm: throughput,
      min: (@min || 0).to_i,
      max: (@max || 0).to_i,
      mode: mode.to_i,
      mean: mean.to_i,
      g_mean: geometric_mean.to_i,
      g_stddev: geometric_standard_deviation.round(2),
      # upper tail probabilities
      g_p75: geometric_interval(0.675), # p(0.25)
      g_p85: geometric_interval(1.036), # p(0.15)
      g_p95: geometric_interval(1.645), # p(0.05)
      g_p99: geometric_interval(2.326), # p(0.01)
      a_p75: arithmetic_interval(0.675), # p(0.25)
      a_p85: arithmetic_interval(1.036), # p(0.15)
      a_p95: arithmetic_interval(1.645), # p(0.05)
      a_p99: arithmetic_interval(2.326), # p(0.01)
      pct_25: percentile(0.25),  
      pct_75: percentile(0.75),  
      pct_85: percentile(0.85),  
      pct_95: percentile(0.95),  
      pct_99: percentile(0.99),  
      median: percentile(0.5),
      stddev: standard_deviation.to_i,
      apdex_t: @apdex_t,
      apdex_f: @apdex_f,
      apdex_s: @values.size - @apdex_t - @apdex_f,
      apdex: apdex,
      outliers: outliers,
      # The last bucket of the histogram is outliers and goes
      # on a separate attribute.
      hist: hist,
      bucket_max: bucket_max,
      # order the breakdown by count descending
      breakdown: Hash[*@breakdown.to_a.sort_by{|k,v| -v[0]}.flatten(1)],
    }
  end

  private

  def throughput
    (60.0 * 1000 * @values.size / @duration.to_f).round
  end

  def mode
    return 0 unless @histogram_buckets && @values.size > 0
    index, max = 0, 0
    @histogram_buckets.each_with_index do | v, i |
      if v > max 
        max = v
        index = i
      end
    end
    (index + 0.5) * @histogram_bucket_size
  end
  def apdex
    return 0 if @values.size == 0 
    ((@values.size.to_f - @apdex_t/2.0 - @apdex_f) / @values.size.to_f).round(2)
  end

  def bucket_max
    return 0 unless @histogram_buckets
    @histogram_buckets[0..-2].max
  end

  # Return a histogram for this bucket.  Each element is an array
  # of count, score, where score is the ratio of the count to the max bucket value
  # used for the interpolated color in the heatmap
  def hist
    return [] unless @histogram_buckets
    max = @histogram_buckets.max.to_f
    @histogram_buckets[0..-2].map { | count | { count: count, score: max > 0 ? count / max : 0 } }
  end

  def outliers
    return [] unless @histogram_buckets
    max = @histogram_buckets.max.to_f
    outlier_count = @histogram_buckets[-1]
    return { count: outlier_count, score: max > 0 ? outlier_count / max : 0 }
  end

  def mean
    @values.size > 0 ? @total / @values.size : 0
  end

  def geometric_mean
    @values.size > 0 ? Math.exp(@sum_of_logs/@values.size) : 0
  end

  def geometric_standard_deviation
    count = @values.size
    return 0 if count == 0 
    v1 = @sum_of_log_squares.to_f/count 
    v2 = (@sum_of_logs.to_f/count)**2
    Math.exp(Math.sqrt([0, v1 - v2].max))
  end

  def geometric_interval(num) 
    return (geometric_mean * (geometric_standard_deviation**num)).round
  end

  def arithmetic_interval(num) 
    return (mean + (num * standard_deviation)).round
  end

  def standard_deviation
    count = @values.size
    return 0 if count == 0 || mean == 0
    x = @sum_of_squares - (count * (mean**2))
    Math.sqrt(x / count)
  end

  def percentile(ratio)
    @vec ||= @values.to_a.sort
    count = @vec.size
    return 0 if count == 0
    index = count * ratio
    @vec[index.floor].round
  end
end
