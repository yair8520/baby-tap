import { useEffect } from 'react'
import './privacy.css'

export default function PrivacyPolicy() {
  useEffect(() => {
    const rootEl = document.getElementById('root')

    const prevLang = document.documentElement.lang
    const prevDir = document.documentElement.dir
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevRootOverflow = rootEl?.style.overflow
    const prevRootHeight = rootEl?.style.height
    const prevTitle = document.title

    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
    document.title = 'Privacy Policy — Baby Tap'

    // Let the document grow so body scroll works even though #root has 100dvh.
    if (rootEl) {
      rootEl.style.overflow = 'visible'
      rootEl.style.height = 'auto'
    }

    return () => {
      document.documentElement.lang = prevLang
      document.documentElement.dir = prevDir
      document.title = prevTitle
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
      if (rootEl) {
        rootEl.style.overflow = prevRootOverflow
        rootEl.style.height = prevRootHeight
      }
    }
  }, [])

  return (
    <main className="privacy-page">
      <header className="privacy-header">
        <button
          type="button"
          className="privacy-back-btn"
          onClick={() => { window.location.hash = '' }}
          aria-label="Back to Baby Tap / חזרה ל-Baby Tap"
        >
          ← חזרה / Back
        </button>
        <h1 className="privacy-title">Privacy Policy / מדיניות פרטיות</h1>
        <p className="privacy-updated">Last updated: March 23, 2026</p>
      </header>

      <section className="privacy-bilingual" dir="ltr">
        <article className="privacy-card privacy-card-en">
          <h2>Privacy Policy</h2>

          <p>
            Baby Tap is designed for children and does not require account creation.
            We do not collect, store, sell, or share personal information from users.
          </p>

          <h3>Information We Collect</h3>
          <p>
            We do not collect personally identifiable information such as names, email
            addresses, phone numbers, location, photos, contacts, or analytics identifiers.
          </p>

          <h3>How the App Works</h3>
          <p>
            The app runs locally on your device and responds to taps and touches to play
            sounds and visual effects. Preferences and progress are stored only on your
            device.
          </p>

          <h3>Children&apos;s Privacy</h3>
          <p>
            This app is intended for young children. Since no personal data is collected,
            we minimize privacy risks for child users.
          </p>

          <h3>Third-Party Services</h3>
          <p>
            The app itself does not include sign-in, advertising SDKs, or third-party
            tracking in the gameplay experience.
          </p>

          <h3>Website Hosting Logs</h3>
          <p>
            When you load the website, the hosting provider may process standard technical
            request logs, such as IP address, browser details, and request time, to deliver
            and secure the site. Baby Tap does not use those logs to profile children or
            add analytics to gameplay.
          </p>

          <h3>Contact</h3>
          <p>
            For privacy questions, contact:{' '}
            <a href="mailto:yair8520@gmail.com">yair8520@gmail.com</a>
          </p>
        </article>

        <article className="privacy-card privacy-card-he" dir="rtl">
          <h2>מדיניות פרטיות</h2>

          <p>
            Baby Tap מיועד לילדים ואינו דורש יצירת חשבון. איננו אוספים, מאחסנים,
            מוכרים או משתפים מידע אישי על משתמשים.
          </p>

          <h3>אילו נתונים אנחנו אוספים</h3>
          <p>
            איננו אוספים מידע שמזהה באופן אישי, כגון שמות, כתובות דוא&quot;ל, מספרי
            טלפון, מיקום, תמונות, אנשי קשר או מזהי אנליטיקה.
          </p>

          <h3>איך האפליקציה עובדת</h3>
          <p>
            האפליקציה פועלת מקומית במכשיר שלך ומגיבה למגעים וללחיצות כדי להשמיע
            צלילים ולהפעיל אפקטים ויזואליים. ההעדפות וההתקדמות נשמרות רק במכשיר.
          </p>

          <h3>פרטיות ילדים</h3>
          <p>
            האפליקציה מיועדת לילדים צעירים. מאחר שלא נאספים נתונים אישיים,
            אנו מצמצמים סיכוני פרטיות עבור משתמשי ילדים.
          </p>

          <h3>שירותים של צד שלישי</h3>
          <p>
            האפליקציה עצמה אינה כוללת התחברות, SDKs של פרסום או מעקב של צד שלישי בתוך חוויית המשחק.
          </p>

          <h3>יומני אירוח האתר</h3>
          <p>
            בעת טעינת האתר, ספק האירוח עשוי לעבד יומני בקשות טכניים רגילים, כגון כתובת
            IP, פרטי דפדפן וזמן הבקשה, כדי לספק ולאבטח את האתר. Baby Tap אינו משתמש
            ביומנים האלה ליצירת פרופיל של ילדים ואינו מוסיף ניתוח נתונים לחוויית המשחק.
          </p>

          <h3>יצירת קשר</h3>
          <p>
            לשאלות בנושא פרטיות, צרו קשר:{' '}
            <a href="mailto:yair8520@gmail.com">yair8520@gmail.com</a>
          </p>
        </article>
      </section>
    </main>
  )
}
