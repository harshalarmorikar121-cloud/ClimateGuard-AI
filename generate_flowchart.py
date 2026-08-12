import os
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

def create_flowchart():
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=150)
    fig.patch.set_facecolor('#0a0f1a')
    ax.set_facecolor('#0a0f1a')
    ax.axis('off')

    # Color Palette
    c_sub = '#94a3b8'
    
    # Node definition function
    def add_node(x, y, w, h, title, subtitle, color):
        box = mpatches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15", 
                                      ec=color, fc='#111827', lw=1.5)
        ax.add_patch(box)
        
        ax.text(x + w/2, y + h*0.62, title, color='#ffffff', weight='bold', 
                fontsize=8.5, ha='center', va='center', family='sans-serif')
        ax.text(x + w/2, y + h*0.32, subtitle, color=c_sub, 
                fontsize=7, ha='center', va='center', family='sans-serif')

    def add_arrow(x1, y1, x2, y2, label=''):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color='#10b981', lw=1.5, mutation_scale=12))
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 0.1, label, color='#38bdf8', fontsize=6.5, weight='bold', ha='center')

    # Header Title
    ax.text(6, 6.0, "ClimateGuard AI — End-to-End System Architecture & Data Flow", color='#10b981', weight='bold', fontsize=12, ha='center')

    # Layer 1: Data Sources
    add_node(0.5, 4.4, 2.2, 0.9, "Open-Meteo API", "Temp, Humidity, Rain", "#38bdf8")
    add_node(0.5, 3.2, 2.2, 0.9, "OSM Overpass API", "Hospital Pins", "#38bdf8")
    add_node(0.5, 2.0, 2.2, 0.9, "WHO RSS & ReliefWeb", "Outbreak Feeds", "#38bdf8")
    add_node(0.5, 0.8, 2.2, 0.9, "NASA / Sentinel", "Climate Data", "#38bdf8")

    # Layer 2: Ingestion & Feature Engineering
    add_node(3.5, 2.3, 2.3, 1.4, "Ingestion & Feature Engine", "Weather Aggregation\nNDVI Calculation\nNormalisation & Imputation", "#f59e0b")

    # Layer 3: ML Intelligence Pipeline
    add_node(6.7, 4.2, 2.2, 0.8, "LSTM Model", "Temporal Dynamics", "#ec4899")
    add_node(6.7, 3.1, 2.2, 0.8, "XGBoost Model", "Feature Importances", "#ec4899")
    add_node(6.7, 2.0, 2.2, 0.8, "Prophet Model", "Seasonality Trends", "#ec4899")
    add_node(6.7, 0.9, 2.2, 0.8, "SHAP XAI Engine", "Explainable Drivers", "#a855f7")

    # Layer 4: Weighted Ensemble Core
    add_node(9.7, 2.3, 2.0, 1.4, "Weighted Ensemble Engine", "93.1% Accuracy\nRisk Score (0-1)\n4-Wk Lookahead", "#10b981")

    # Layer 5: Actionable Outputs
    add_node(12.5, 4.4, 2.2, 0.9, "Interactive Risk Map", "OpenStreetMap Overlay", "#10b981")
    add_node(12.5, 3.2, 2.2, 0.9, "Vulnerable Groups Hub", "Seniors 55+ & Infants 0-4", "#ef4444")
    add_node(12.5, 2.0, 2.2, 0.9, "Caregiver Warnings", "Emergency Actions", "#f59e0b")
    add_node(12.5, 0.8, 2.2, 0.9, "Automated Alert Net", "SMS & Email Alerts", "#10b981")

    # Connections
    add_arrow(2.7, 4.85, 3.5, 3.2)
    add_arrow(2.7, 3.65, 3.5, 3.0)
    add_arrow(2.7, 2.45, 3.5, 2.8)
    add_arrow(2.7, 1.25, 3.5, 2.6)

    add_arrow(5.8, 3.2, 6.7, 4.6, "Clean Data")
    add_arrow(5.8, 3.0, 6.7, 3.5)
    add_arrow(5.8, 2.8, 6.7, 2.4)
    add_arrow(5.8, 2.5, 6.7, 1.3, "Features")

    add_arrow(8.9, 4.6, 9.7, 3.4)
    add_arrow(8.9, 3.5, 9.7, 3.2)
    add_arrow(8.9, 2.4, 9.7, 3.0)
    add_arrow(8.9, 1.3, 9.7, 2.7, "SHAP Values")

    add_arrow(11.7, 3.4, 12.5, 4.85)
    add_arrow(11.7, 3.2, 12.5, 3.65)
    add_arrow(11.7, 3.0, 12.5, 2.45)
    add_arrow(11.7, 2.7, 12.5, 1.25)

    ax.set_xlim(-0.2, 15.2)
    ax.set_ylim(0.2, 6.4)

    output_path = os.path.join(os.path.dirname(__file__), "flowchart.png")
    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight', dpi=150)
    plt.close()
    print(f"Flowchart saved to {output_path}")
    return output_path

if __name__ == "__main__":
    create_flowchart()
