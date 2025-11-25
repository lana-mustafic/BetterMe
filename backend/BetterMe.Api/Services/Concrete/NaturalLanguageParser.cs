using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace BetterMe.Api.Services.Concrete
{
    public class NaturalLanguageParser : INaturalLanguageParser
    {
        private readonly Dictionary<string, int> _priorityKeywords = new Dictionary<string, int>
        {
            { "urgent", 3 },
            { "high priority", 3 },
            { "high", 3 },
            { "important", 3 },
            { "critical", 3 },
            { "asap", 3 },
            { "as soon as possible", 3 },
            { "medium priority", 2 },
            { "medium", 2 },
            { "normal", 2 },
            { "low priority", 1 },
            { "low", 1 }
        };

        private readonly Dictionary<string, string> _categoryKeywords = new Dictionary<string, string>
        {
            { "work", "Work" },
            { "personal", "Personal" },
            { "shopping", "Shopping" },
            { "health", "Health" },
            { "fitness", "Health" },
            { "exercise", "Health" },
            { "finance", "Finance" },
            { "money", "Finance" },
            { "study", "Education" },
            { "learn", "Education" },
            { "education", "Education" },
            { "home", "Home" },
            { "house", "Home" },
            { "family", "Family" },
            { "friends", "Social" },
            { "social", "Social" },
            { "travel", "Travel" },
            { "project", "Work" }
        };

        public ParseTaskResponse ParseTaskInput(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return new ParseTaskResponse { Title = input };
            }

            var response = new ParseTaskResponse
            {
                Title = input.Trim(),
                Priority = 1,
                Category = "Other",
                Tags = new List<string>(),
                ExtractedData = new Dictionary<string, object>()
            };

            // Remove parsed parts from title
            var workingText = input.Trim();

            // Extract priority
            var priority = ExtractPriority(workingText);
            response.Priority = priority.Priority;
            workingText = priority.RemainingText;

            // Extract due date
            var dateResult = ExtractDueDate(workingText);
            response.DueDate = dateResult.DueDate;
            workingText = dateResult.RemainingText;

            // Extract category
            var category = ExtractCategory(workingText);
            response.Category = category.Category;
            workingText = category.RemainingText;

            // Extract tags (words starting with #)
            var tags = ExtractTags(workingText);
            response.Tags = tags.Tags;
            workingText = tags.RemainingText;

            // Clean up title - remove extra whitespace and common separators
            response.Title = CleanTitle(workingText);

            // Store extracted metadata
            response.ExtractedData["originalInput"] = input;
            if (dateResult.ExtractedDateText != null)
            {
                response.ExtractedData["dateText"] = dateResult.ExtractedDateText;
            }

            return response;
        }

        private (int Priority, string RemainingText) ExtractPriority(string text)
        {
            var lowerText = text.ToLowerInvariant();
            var priority = 1;
            var remainingText = text;

            // Check for priority keywords
            foreach (var keyword in _priorityKeywords.Keys.OrderByDescending(k => k.Length))
            {
                var pattern = $@"\b{Regex.Escape(keyword)}\b";
                if (Regex.IsMatch(lowerText, pattern, RegexOptions.IgnoreCase))
                {
                    priority = _priorityKeywords[keyword];
                    remainingText = Regex.Replace(remainingText, pattern, "", RegexOptions.IgnoreCase);
                    break; // Take the first match (highest priority)
                }
            }

            return (priority, remainingText);
        }

        private (DateTime? DueDate, string RemainingText, string? ExtractedDateText) ExtractDueDate(string text)
        {
            var lowerText = text.ToLowerInvariant();
            var remainingText = text;
            DateTime? dueDate = null;
            string? extractedDateText = null;

            var now = DateTime.Now;
            var today = now.Date;
            var tomorrow = today.AddDays(1);
            var nextWeek = today.AddDays(7);
            var nextMonth = today.AddMonths(1);

            // Time patterns
            var timePattern = @"\b(\d{1,2}):(\d{2})\s*(am|pm)?\b";
            var timeMatch = Regex.Match(lowerText, timePattern, RegexOptions.IgnoreCase);
            int? hour = null;
            int? minute = null;

            if (timeMatch.Success)
            {
                hour = int.Parse(timeMatch.Groups[1].Value);
                minute = int.Parse(timeMatch.Groups[2].Value);
                var amPm = timeMatch.Groups[3].Value.ToLower();

                if (!string.IsNullOrEmpty(amPm))
                {
                    if (amPm == "pm" && hour < 12) hour += 12;
                    if (amPm == "am" && hour == 12) hour = 0;
                }
                else if (hour > 12)
                {
                    // Assume 24-hour format
                }
                else
                {
                    // Default to PM if ambiguous
                    if (hour < 7) hour += 12;
                }

                extractedDateText = timeMatch.Value;
                remainingText = Regex.Replace(remainingText, timePattern, "", RegexOptions.IgnoreCase);
            }

            // Date patterns
            var datePatterns = new[]
            {
                // Tomorrow
                (@"\btomorrow\b", tomorrow),
                // Today
                (@"\btoday\b", today),
                // Next week
                (@"\bnext\s+week\b", nextWeek),
                // Next month
                (@"\bnext\s+month\b", nextMonth),
                // Days of week
                (@"\bmonday\b", GetNextWeekday(DayOfWeek.Monday, today)),
                (@"\btuesday\b", GetNextWeekday(DayOfWeek.Tuesday, today)),
                (@"\bwednesday\b", GetNextWeekday(DayOfWeek.Wednesday, today)),
                (@"\bthursday\b", GetNextWeekday(DayOfWeek.Thursday, today)),
                (@"\bfriday\b", GetNextWeekday(DayOfWeek.Friday, today)),
                (@"\bsaturday\b", GetNextWeekday(DayOfWeek.Saturday, today)),
                (@"\bsunday\b", GetNextWeekday(DayOfWeek.Sunday, today)),
                // Relative days
                (@"\bin\s+(\d+)\s+days?\b", (DateTime?)null), // Will be handled separately
                (@"\b(\d+)\s+days?\s+from\s+now\b", (DateTime?)null), // Will be handled separately
                // Date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
                (@"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", (DateTime?)null), // Will be handled separately
                (@"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", (DateTime?)null), // Will be handled separately
            };

            foreach (var (pattern, defaultDate) in datePatterns)
            {
                var match = Regex.Match(lowerText, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    DateTime? parsedDate = defaultDate;

                    // Handle special cases
                    if (pattern.Contains(@"\d+"))
                    {
                        if (pattern.Contains("days"))
                        {
                            var days = int.Parse(match.Groups[1].Value);
                            parsedDate = today.AddDays(days);
                        }
                        else if (pattern.Contains("/") || pattern.Contains("-"))
                        {
                            // Try parsing as date
                            if (DateTime.TryParse(match.Value, out var parsed))
                            {
                                parsedDate = parsed.Date;
                            }
                        }
                    }

                    if (parsedDate.HasValue)
                    {
                        // Apply time if extracted
                        if (hour.HasValue && minute.HasValue)
                        {
                            dueDate = parsedDate.Value.Date.AddHours(hour.Value).AddMinutes(minute.Value);
                        }
                        else
                        {
                            dueDate = parsedDate.Value;
                        }

                        extractedDateText = extractedDateText ?? match.Value;
                        remainingText = Regex.Replace(remainingText, pattern, "", RegexOptions.IgnoreCase);
                        break;
                    }
                }
            }

            // If we have time but no date, assume today
            if (hour.HasValue && minute.HasValue && !dueDate.HasValue)
            {
                dueDate = today.AddHours(hour.Value).AddMinutes(minute.Value);
            }

            return (dueDate, remainingText, extractedDateText);
        }

        private DateTime GetNextWeekday(DayOfWeek dayOfWeek, DateTime startDate)
        {
            var daysUntil = ((int)dayOfWeek - (int)startDate.DayOfWeek + 7) % 7;
            return daysUntil == 0 ? startDate.AddDays(7) : startDate.AddDays(daysUntil);
        }

        private (string Category, string RemainingText) ExtractCategory(string text)
        {
            var lowerText = text.ToLowerInvariant();
            var category = "Other";
            var remainingText = text;

            foreach (var keyword in _categoryKeywords.Keys.OrderByDescending(k => k.Length))
            {
                var pattern = $@"\b{Regex.Escape(keyword)}\b";
                if (Regex.IsMatch(lowerText, pattern, RegexOptions.IgnoreCase))
                {
                    category = _categoryKeywords[keyword];
                    remainingText = Regex.Replace(remainingText, pattern, "", RegexOptions.IgnoreCase);
                    break;
                }
            }

            return (category, remainingText);
        }

        private (List<string> Tags, string RemainingText) ExtractTags(string text)
        {
            var tags = new List<string>();
            var remainingText = text;

            // Extract hashtags
            var hashtagPattern = @"#(\w+)";
            var matches = Regex.Matches(text, hashtagPattern);

            foreach (Match match in matches)
            {
                tags.Add(match.Groups[1].Value);
                remainingText = remainingText.Replace(match.Value, "");
            }

            return (tags, remainingText);
        }

        private string CleanTitle(string text)
        {
            // Remove extra whitespace
            text = Regex.Replace(text, @"\s+", " ");
            // Remove leading/trailing whitespace and common separators
            text = text.Trim().TrimEnd(',', '.', ';', ':');
            return text;
        }
    }
}

