# Computes a spatial-clustering signal from a list of recent events.
# Heuristic: if many actions land inside a tight bounding-box radius
# over a short period, treat that as concentrated/targeted activity.
class SpatialPatternService
  Result = Struct.new(:radius, :event_count, :clustered, :score, keyword_init: true)

  def self.analyze(events)
    coords = events.filter_map { |e| [e["x"] || e[:x], e["y"] || e[:y], e["z"] || e[:z]] if (e["x"] || e[:x]) }
    return Result.new(radius: 0, event_count: 0, clustered: false, score: 0) if coords.size < 5

    xs = coords.map { |c| c[0] }
    ys = coords.map { |c| c[1] }
    zs = coords.map { |c| c[2] }

    dx = xs.max - xs.min
    dy = ys.max - ys.min
    dz = zs.max - zs.min
    radius = Math.sqrt(dx**2 + dy**2 + dz**2) / 2.0

    score =
      if coords.size >= 25 && radius <= 10
        25
      elsif coords.size >= 15 && radius <= 15
        18
      elsif coords.size >= 10 && radius <= 20
        10
      else
        0
      end

    Result.new(
      radius: radius.round(1),
      event_count: coords.size,
      clustered: score >= 10,
      score: score
    )
  end
end
