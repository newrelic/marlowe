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
    @timestamp = timestamp
    @duration = duration
    @value_index = opts[:value_index] || 4
    @histogram_bucket_count = opts[:histogram_bucket_count]
    @histogram_bucket_size =  opts[:histogram_bucket_size]
    @t = (opts[:apdex_t] || 500).to_f
    @values = []
    @apdex_f = @apdex_t = @total = @sum_of_squares = @sum_of_log_squares = @sum_of_logs = 0
    if @histogram_bucket_size
      @histogram_bucket_count ||= 10000 / @histogram_bucket_size
      @histogram_buckets = [0] * (@histogram_bucket_count + 1)
    end
  end

  # There's an anomaly in some of the data where the value is zero.
  # We're going to treat zero as absent
  def add(record) 
    v = record[@value_index]
    return if v.zero?
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
  end

  alias :"<<" :add

  def empty?
    @values.size == 0
  end

  def record
    r = {
      time: @timestamp,
      count: @values.size,
      rpm: throughput,
      min: (@min || 0).to_i,
      max: (@max || 0).to_i,
      mode: mode.to_i,
      mean: mean.to_i,
      g_mean: geometric_mean.to_i,
      g_stddev: geometric_standard_deviation.to_i,
      pct_25: pct_25,
      pct_75: pct_75,
      pct_95: pct_95,
      pct_99: pct_99,
      median: median.to_i,
      std_dev: standard_deviation.to_i,
      apdex_t: @apdex_t,
      apdex_f: @apdex_f,
      apdex_s: @values.size - @apdex_t - @apdex_f,
      apdex: apdex,
      outliers: outliers,
      # The last bucket of the histogram is outliers and goes
      # on a separate attribute.
      hist: hist,
      bucket_max: bucket_max
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
    v2 = @sum_of_logs.to_f/count
    Math.exp(Math.sqrt(v1 - v2))
  end

  def standard_deviation
    count = @values.size
    return 0 if count == 0 || mean == 0
    x = @sum_of_squares - (count * (mean**2))
    Math.sqrt(x / count)
  end
  def pct_95
    percentile(0.95)
  end
  def pct_99
    percentile(0.99)
  end
  def pct_75
    percentile(0.75)
  end
  def pct_25
    percentile(0.25)
  end
  def median
    percentile(0.5)
  end
  def percentile(ratio)
    @vec ||= @values.to_a.sort
    count = @vec.size
    return 0 if count == 0
    index = count * ratio
    @vec[index.floor]
  end
end
