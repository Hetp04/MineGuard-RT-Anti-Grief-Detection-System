module ApplicationHelper
  def status_pill(status)
    content_tag(:span, status.to_s.tr("_", " "), class: "pill #{status}")
  end

  def severity_pill(severity)
    content_tag(:span, severity.to_s, class: "pill #{severity}")
  end

  def score_status(score)
    return "critical"   if score >= 80
    return "suspicious" if score >= 60
    return "watching"   if score >= 30
    "normal"
  end

  def avatar_for(name)
    initials = name.to_s.scan(/\b\w/).first(2).join.upcase
    initials.presence || "?"
  end

  def fmt_time(t)
    t&.strftime("%H:%M:%S")
  end
end
