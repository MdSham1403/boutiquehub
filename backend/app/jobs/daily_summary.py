"""
Sends the "Daily Sales Summary" Telegram notification from the spec.

This is a standalone script (not an HTTP endpoint) because it's meant to
run on a schedule, not be triggered by a request. Wire it up with
whichever scheduler your deployment supports:

  - Railway: add a Cron Job pointing at `python -m app.jobs.daily_summary`
  - Any VM: a crontab entry, e.g. `0 21 * * * cd /app && python -m app.jobs.daily_summary`
  - GitHub Actions: a scheduled workflow that calls the admin endpoint instead
    (see POST /api/admin/notifications/daily-summary for an HTTP-triggerable
    alternative if your host doesn't support native cron)

Usage:
    python -m app.jobs.daily_summary
"""
from app.database import SessionLocal
from app.utils.notifications import send_daily_sales_summary


def run():
    db = SessionLocal()
    try:
        send_daily_sales_summary(db)
    finally:
        db.close()


if __name__ == "__main__":
    run()
