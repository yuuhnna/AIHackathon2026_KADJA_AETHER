from pathlib import Path
import matplotlib.pyplot as plt


PLOTS_DIR = Path("analysis/plots")
PLOTS_DIR.mkdir(parents=True, exist_ok=True)


def save_plot(filename: str):
    """
    Save the current matplotlib figure.
    """
    plt.tight_layout()

    plt.savefig(
        PLOTS_DIR / filename,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()