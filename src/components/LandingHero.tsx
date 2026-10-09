import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpLeft, Check, GraduationCap, Sliders } from 'lucide-react';
import styles from './LandingHero.module.css';

export function LandingHero({ isAr }: { isAr: boolean }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.layout}>
        <div className={styles.content}>
          <h1 id="hero-heading" className={styles.title}>
            {isAr ? 'رحلتك مع القرآن، تبدأ بسَنَد.' : 'Your Quran journey starts with Sanad.'}
          </h1>
          <p className={styles.description}>
            {isAr
              ? 'تعلّم التلاوة، وأتقن الحفظ، وراجع بثقة. حصص فردية مع معلّمين مجازين، وخطة تناسب هدفك ووقتك.'
              : 'Learn to recite, memorize, and revise with confidence. One-to-one lessons with qualified teachers and a plan that fits your goals and schedule.'}
          </p>
          <div className={styles.actions}>
            <Link href="/register/student" className={styles.primary}>
              {isAr ? 'ابدأ رحلتك مع القرآن' : 'Start your Quran journey'}
              <ArrowUpLeft size={20} className={isAr ? undefined : styles.ltrArrow} aria-hidden="true" />
            </Link>
            <a href="#simulator" className={styles.secondary}>
              <Sliders size={18} aria-hidden="true" />
              {isAr ? 'خطّط لحصصك' : 'Plan your lessons'}
            </a>
          </div>
          <ul className={styles.benefits}>
            {[
              isAr ? 'معلّمون مجازون' : 'Qualified teachers',
              isAr ? 'حصص فردية مباشرة' : 'Live, private lessons',
              isAr ? 'مواعيد تناسبك' : 'Flexible scheduling',
            ].map((benefit) => (
              <li key={benefit}><Check size={16} aria-hidden="true" />{benefit}</li>
            ))}
          </ul>
        </div>

        <div className={styles.visual}>
          <div className={styles.arch} aria-hidden="true" />
          <div className={styles.portrait}>
            <Image
              src="/images/hero-quran-teacher-no-scarf.png"
              alt={isAr ? 'معلّم يقرأ القرآن الكريم' : 'A teacher reading the Quran'}
              fill
              sizes="(max-width: 600px) 90vw, (max-width: 1023px) 460px, 480px"
              className={styles.image}
              preload
            />
          </div>
          <div className={styles.lessonNote}>
            <span className={styles.noteIcon}><GraduationCap size={25} aria-hidden="true" /></span>
            <div>
              <p>{isAr ? 'خطوة بخطوة، مع معلّمك' : 'Step by step, with your teacher'}</p>
              <span>{isAr ? 'تلاوة · حفظ · مراجعة' : 'Recitation · Memorization · Revision'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
