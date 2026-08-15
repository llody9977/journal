import os
import sys

try:
    import yaml
except ModuleNotFoundError:  # pragma: no cover - environment guard
    sys.exit(
        "generate_topic_nav.py needs PyYAML, which is not in the standard library.\n"
        "Install it with:  python3 -m pip install -r requirements.txt\n"
        "The four CI checks under scripts/ are dependency-free and do not need it; "
        "only this navigation generator does."
    )

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
nav_path = os.path.join(repo_root, "_data", "nav.yml")

with open(nav_path, "r", encoding="utf-8") as f:
    nav_data = yaml.safe_load(f)

# Extract flat ordered list of items with title & url
ordered_topics = []

def extract_urls(items):
    for item in items:
        if isinstance(item, dict):
            if "url" in item and item["url"].startswith("/topics/"):
                ordered_topics.append({"title": item["title"], "url": item["url"]})
            if "children" in item:
                extract_urls(item["children"])

extract_urls(nav_data)

print(f"Extracted {len(ordered_topics)} ordered topics from nav.yml.")

# Generate Jekyll Liquid map for topic-nav.html
html = """{% assign current_url = page.url %}
{% assign prev_title = "" %}
{% assign prev_url = "" %}
{% assign next_title = "" %}
{% assign next_url = "" %}

"""

for i, topic in enumerate(ordered_topics):
    prev_item = ordered_topics[i-1] if i > 0 else None
    next_item = ordered_topics[i+1] if i < len(ordered_topics) - 1 else None
    
    url = topic["url"]
    html += f"{{% if current_url == '{url}' or current_url == '{url[:-1]}' %}}\n"
    if prev_item:
        html += f"  {{% assign prev_title = '{prev_item['title']}' %}}\n"
        html += f"  {{% assign prev_url = '{prev_item['url']}' %}}\n"
    if next_item:
        html += f"  {{% assign next_title = '{next_item['title']}' %}}\n"
        html += f"  {{% assign next_url = '{next_item['url']}' %}}\n"
    html += "{% endif %}\n"

html += """
{% if prev_url != "" or next_url != "" %}
<nav class="topic-footer-nav" aria-label="Topic navigation">
  <div class="nav-prev">
    {% if prev_url != "" %}
    <a href="{{ prev_url | relative_url }}" class="topic-nav-link">
      <span class="nav-direction">← Previous Topic</span>
      <span class="nav-title">{{ prev_title }}</span>
    </a>
    {% endif %}
  </div>
  <div class="nav-next">
    {% if next_url != "" %}
    <a href="{{ next_url | relative_url }}" class="topic-nav-link">
      <span class="nav-direction">Next Topic →</span>
      <span class="nav-title">{{ next_title }}</span>
    </a>
    {% endif %}
  </div>
</nav>
{% endif %}
"""

target_path = os.path.join(repo_root, "_includes", "topic-nav.html")
with open(target_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Generated _includes/topic-nav.html successfully.")
