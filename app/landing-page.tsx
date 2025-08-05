import {
  ShieldCheck,
  Heart,
  Users,
  Annoyed,
  Handshake,
  Search,
  MessageSquare,
  Group,
  Star,
  // Instagram,
  // Twitch,
  // Twitter,
} from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="bg-gray-900 w-screen flex flex-col items-center text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 py-2 px-4 bg-gray-900/80 backdrop-blur-sm w-full border-b flex justify-center border-gray-800">
        <div className="mx-auto max-w-7xl flex justify-between w-full items-center">
          <h1 className="text-2xl font-bold text-white">Spot</h1>
          <a
            id="beta-tester-header-link"
            href="#cta"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
          >
            베타 테스터 신청하기
          </a>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center text-center gap-8 mb-20">
              <h4 className="text-4xl md:text-6xl font-extrabold leading-tight">
                직관의 감동, <br /> 같은 공간의 누군가와 바로 나눠보세요
              </h4>
              <p className="text-lg md:text-xl text-gray-300 max-w-5xl">
                경기 중엔 뜨거운 응원,
                <br className="sm:hidden" /> 경기 후엔 시원한 뒷풀이까지!
                <br className="sm:hidden" /> 낯선 사람에게 말 걸 용기가 없어도
                괜찮아요.
              </p>
              <a
                id="beta-tester-hero-link"
                href="#cta"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105"
              >
                베타 테스터 신청하기
              </a>
              {/* 출시 알림 등록 버튼 */}
            </div>
            {/* App Mockup */}
            <div className="relative max-w-6xl mx-auto flex justify-center">
              <Image
                src="/images/Spot-main-image.png"
                alt="Spot"
                width={1000}
                height={1000}
              />
            </div>
          </div>
        </section>

        {/* Problem & Empathy Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-900 to-gray-950">
          <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-16">
            <h3 className="text-3xl md:text-4xl font-bold text-center">
              혹시 이런 경험 있으신가요?
            </h3>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 w-full">
              <div className="bg-gray-800/50 p-8 rounded-lg text-center border border-gray-700/50 transition duration-300 hover:border-indigo-500 hover:scale-105 hover:bg-gray-800">
                <Annoyed className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
                <p className="text-lg text-gray-300">
                  승리의 감동,
                  <br /> 혼자 삭히기 아쉬웠던 순간
                </p>
              </div>
              <div className="bg-gray-800/50 p-8 rounded-lg text-center border border-gray-700/50 transition duration-300 hover:border-indigo-500 hover:scale-105 hover:bg-gray-800">
                <Users className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
                <p className="text-lg text-gray-300">
                  직관 왔는데,
                  <br /> 같이 치맥할 친구가 없어 망설여졌던 적
                </p>
              </div>
              <div className="bg-gray-800/50 p-8 rounded-lg text-center border border-gray-700/50 transition duration-300 hover:border-indigo-500 hover:scale-105 hover:bg-gray-800">
                <Handshake className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
                <p className="text-lg text-gray-300">
                  명장면이 나왔을 때,
                  <br /> 나만 보기 아까웠던 경험
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution & Value Proposition Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-20">
            <h3 className="text-3xl md:text-4xl font-bold text-center">
              Spot이 당신의 직관 경험을 한층 더 특별하게 만들어 드릴게요!
            </h3>
            <div className="grid md:grid-cols-3 gap-8 md:gap-16 text-center w-full">
              <div>
                <Heart className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold mb-4">
                  현장에서의 즉흥적인 연결
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  미리 계획할 필요 없이,
                  <br /> 지금 바로 경기장에 있는 팬들과 연결해보세요.
                </p>
              </div>
              <div>
                <MessageSquare className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold mb-4">
                  부담 없는 소통의 시작
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  직접 말 걸 필요 없이,
                  <br /> 앱을 통해 가볍게 대화를 시작하고 어색함을 허무세요.
                </p>
              </div>
              <div>
                <Group className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold mb-4">
                  같은 팀, 같은 공감대
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  이미 강력한 유대감을 가진 동료 팬들과 만나
                  <br /> 더 깊은 유대감을 형성할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-950 to-gray-900">
          <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-20">
            <h3 className="text-3xl md:text-4xl font-bold text-center">
              Spot, 이렇게 쉽고 간편하게 이용하세요!
            </h3>

            {/* Steps container */}
            <div className="space-y-12 md:space-y-20 w-full">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="inline-flex items-center gap-4 mb-4">
                    <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                      1
                    </div>
                    <h4 className="text-2xl font-semibold">
                      게시글 작성 &amp; 발견
                    </h4>
                  </div>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    지금 이 경기장에서 나의 글을 올려보세요. 짧은 메시지와 응원
                    팀을 담아 &apos;함께 응원할 팬&apos;, &apos;경기 후 치맥할
                    사람&apos; 등을 찾아보세요. 프로필 사진, 나이/성별은 필수!
                    게시글은 1시간 후 자동 만료됩니다.
                  </p>
                </div>
                <div className="md:w-1/2">
                  <div className="bg-white rounded-lg p-4 h-80 flex items-center justify-center shadow-2xl transform hover:scale-125 transition-transform duration-300">
                    <Image
                      src="/images/mockup-home.png"
                      alt="Spot 게시글 작성/목록 화면 목업"
                      width={320}
                      height={640}
                      className="object-contain h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="inline-flex items-center gap-4 mb-4">
                    <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                      2
                    </div>
                    <h4 className="text-2xl font-semibold">
                      &apos;흥미 있어요&apos; &amp; 그룹 매칭
                    </h4>
                  </div>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    관심 가는 글에 &apos;흥미 있어요&apos;를 눌러 마음을
                    표현하세요. 글 작성자는 관심을 표한 팬들 중 원하는 이들을
                    선택해 3~5명의 그룹 채팅방을 즉시 개설할 수 있습니다.
                  </p>
                </div>
                <div className="md:w-1/2">
                  <div className="bg-white rounded-lg p-4 h-80 flex items-center justify-center shadow-2xl transform hover:scale-125 transition-transform duration-300">
                    <Image
                      src="/images/mockup-group.png"
                      alt="Spot 관심 표현/매칭 화면 목업"
                      width={320}
                      height={640}
                      className="object-contain h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="inline-flex items-center gap-4 mb-4">
                    <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                      3
                    </div>
                    <h4 className="text-2xl font-semibold">
                      자유로운 소통 &amp; 만남
                    </h4>
                  </div>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    생성된 채팅방에서 부담 없이 대화를 나누고, 원한다면 바로
                    오프라인 만남으로 이어가세요. 경기 후 뒷풀이부터 명장면 감동
                    공유까지!
                  </p>
                </div>
                <div className="md:w-1/2">
                  <div className="bg-white rounded-lg p-4 h-80 flex items-center justify-center shadow-2xl transform hover:scale-125 transition-transform duration-300">
                    <Image
                      src="/images/mockup-chat.png"
                      alt="Spot 채팅방/팬 소통 화면 목업"
                      width={320}
                      height={640}
                      className="object-contain h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 새로 추가할 '출시 알림 등록' 섹션 시작 --- */}
        <section className="py-16 sm:py-24 bg-gray-900">
          {' '}
          {/* 배경색은 기존 테마에 맞춰 조절 */}
          <div className="mx-auto max-w-7xl px-6 flex flex-col items-center text-center gap-6">
            <h3 className="text-3xl md:text-4xl font-bold">
              Spot의 새로운 소식을 가장 먼저 받아보세요!
            </h3>
            <p className="text-gray-400 max-w-3xl leading-relaxed">
              아직 베타 테스트는 부담스러우신가요?
              <br /> 이메일을 남겨주시면 Spot의 정식 출시 소식을 가장 먼저
              알려드릴게요.
            </p>
            <a
              id="release-notify-form"
              href="https://forms.gle/HoUr41GrhngVc9r27" // 출시 알림 구글 폼 링크
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-200 !text-indigo-700 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-300 transition duration-300 transform hover:scale-105"
            >
              출시 알림만 받아보기
            </a>
          </div>
        </section>
        {/* --- 새로 추가할 '출시 알림 등록' 섹션 끝 --- */}

        {/* Safety & Trust Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-20">
            <div className="text-center">
              <ShieldCheck className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h3 className="text-3xl md:text-4xl font-bold">
                Spot은 당신의 안전을 최우선으로 생각합니다.
              </h3>
            </div>
            <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-x-16 gap-y-12 w-full">
              <div className="flex items-start gap-5">
                <ShieldCheck className="w-8 h-8 text-green-400 mt-1 flex-shrink-0" />
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-lg">필수 프로필 정보</h4>
                  <p className="text-gray-400 leading-relaxed">
                    사진, 나이대, 성별 필수 입력으로 신뢰도를 높이고 불순한
                    의도를 차단합니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <Star className="w-8 h-8 text-green-400 mt-1 flex-shrink-0" />
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-lg">매너 점수 시스템</h4>
                  <p className="text-gray-400 leading-relaxed">
                    사용자 스스로 매너를 지키도록 유도하여 건전한 커뮤니티를
                    만듭니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <Search className="w-8 h-8 text-green-400 mt-1 flex-shrink-0" />
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-lg">
                    공개된 현장 기반 만남
                  </h4>
                  <p className="text-gray-400 leading-relaxed">
                    다수가 모인 공개된 경기장에서의 만남을 지향하여 안전성을
                    높입니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-8 h-8 flex-shrink-0 mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full text-green-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-lg">
                    강력한 신고 및 차단 기능
                  </h4>
                  <p className="text-gray-400 leading-relaxed">
                    불쾌하거나 부적절한 사용자를 즉시 제재하여 안전한 환경을
                    유지합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section
          id="cta"
          className="py-24 sm:py-32 bg-indigo-700 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-white/10 rounded-full"></div>
          <div className="mx-auto max-w-7xl px-6 relative z-10 flex flex-col items-center text-center gap-8">
            <h3 className="text-3xl md:text-4xl font-bold">
              지금 바로 Spot의 첫번째 사용자가 되어보세요!
            </h3>
            <p className="text-indigo-200 max-w-3xl leading-relaxed">
              베타 테스터로 신청하고 가장 먼저 Spot의 놀라운 기능들을
              경험해보세요.
              <br className="max-sm:hidden" /> 여러분의 소중한 피드백이 더 나은
              Spot을 만듭니다.
            </p>
            <a
              id="beta-tester-form"
              href="https://forms.gle/mEy7PCzCCWijnvS26"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white !text-indigo-700 cursor-pointer font-bold py-4 px-10 rounded-full text-lg hover:bg-gray-200 transition duration-300 transform hover:scale-105 shadow-2xl"
            >
              베타 테스터 신청하기 (Google Form)
            </a>
          </div>
        </section>
      </main>

      {/* New section added below the footer */}
      <div className="w-full flex flex-col items-center py-12 bg-gray-900">
        <h4 className="text-xl font-bold mb-2 text-white">
          Spot, 당신의 의견이 필요해요!
        </h4>
        <p className="text-gray-400 mb-4 text-center text-sm">
          아래 설문에 참여해주시면 서비스 개선에 큰 도움이 됩니다.
        </p>
        <a
          id="survey-form"
          href="https://forms.gle/A24YLxMgom9y19xz9"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full transition"
        >
          간단 설문조사 참여하기
        </a>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 py-16 border-t border-gray-800 w-full">
        <div className="mx-auto max-w-7xl px-6 text-center text-gray-400 flex flex-col items-center gap-8">
          {/* <div className="flex justify-center gap-6">
            <a
              href="#"
              className="text-gray-500 hover:text-white transition-colors"
            >
              <Instagram />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-white transition-colors"
            >
              <Twitter />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-white transition-colors"
            >
              <Twitch />
            </a>
          </div>
          <div className="flex justify-center items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">
              이용약관
            </a>
            <span className="select-none text-gray-600">|</span>
            <a href="#" className="hover:text-white transition-colors">
              개인정보처리방침
            </a>
          </div> */}
          <div className="flex flex-col gap-1">
            <p>&copy; {new Date().getFullYear()} Spot. All rights reserved.</p>
            {/* <p className="text-sm">
              문의:{' '}
              <a href="mailto:contact@spot.com" className="hover:text-white">
                contact@spot.com
              </a>
            </p> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
