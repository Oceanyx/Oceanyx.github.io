/* ==========================================================================
   Oceanyx: site.js
   Shared behaviour for every page. No dependencies. Each feature is wrapped
   so that if one fails, the page still works and nothing stays hidden.

   1. Contact           copy-email button and the mailto: form
   2. Scroll reveal     fades sections in as they scroll into view
   3. Home page         nav scrolling, depth gauge, depth veil, animation pause
   4. Document pages    section rail highlight, demo video placeholder
   ========================================================================== */
(function () {
	"use strict";

	var doc = document.documentElement;
	var reduceMotion =
		window.matchMedia &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// Base64 so the address isn't sitting in the page source as plain text.
	// This stops simple scrapers. To change it: btoa("you@example.com")
	var ENCODED_ADDRESS = "YmNoYW55eEBnbWFpbC5jb20=";

	function safely(fn) {
		try {
			fn();
		} catch (err) {
			if (window.console) console.error(err);
		}
	}

	/* Calls fn at most once per animation frame while the page scrolls or resizes */
	function onScrollFrame(fn) {
		var queued = false;
		function run() {
			queued = false;
			fn();
		}
		function request() {
			if (!queued) {
				queued = true;
				requestAnimationFrame(run);
			}
		}
		window.addEventListener("scroll", request, { passive: true });
		window.addEventListener("resize", request);
		fn();
	}

	function copyText(text) {
		if (navigator.clipboard && window.isSecureContext) {
			return navigator.clipboard.writeText(text);
		}
		// Older browsers and non-HTTPS pages
		return new Promise(function (resolve, reject) {
			var box = document.createElement("textarea");
			box.value = text;
			box.setAttribute("readonly", "");
			box.style.position = "fixed";
			box.style.opacity = "0";
			document.body.appendChild(box);
			box.select();
			var ok = false;
			try {
				ok = document.execCommand("copy");
			} catch (err) {
				ok = false;
			}
			document.body.removeChild(box);
			if (ok) resolve();
			else reject();
		});
	}

	/* ---- 1. Contact ------------------------------------------------------- */
	safely(function () {
		// Copy-email button. It starts hidden and only appears once this script
		// runs, so it never shows up as a button that does nothing.
		var copyButton = document.getElementById("copy-email");
		if (copyButton) {
			var label = copyButton.querySelector(".copy-label");
			var resetTimer;
			copyButton.hidden = false;
			copyButton.addEventListener("click", function () {
				var address = atob(ENCODED_ADDRESS);
				copyText(address).then(
					function () {
						label.textContent = "Copied to clipboard";
						clearTimeout(resetTimer);
						resetTimer = setTimeout(function () {
							label.textContent = "Copy email address";
						}, 2200);
					},
					function () {
						// Couldn't copy, so open their mail app instead
						window.location.href = "mailto:" + address;
					},
				);
			});
		}

		var form = document.getElementById("compose-form");
		if (!form) return;
		form.addEventListener("submit", function (e) {
			e.preventDefault();
			var name = document.getElementById("compose-name").value.trim();
			var subject = document.getElementById("compose-subject").value.trim();
			var message = document.getElementById("compose-message").value.trim();
			if (!subject) subject = name ? "Hi Brian, it's " + name : "Hi Brian";
			window.location.href =
				"mailto:" +
				atob(ENCODED_ADDRESS) +
				"?subject=" +
				encodeURIComponent(subject) +
				"&body=" +
				encodeURIComponent(message);
		});
	});

	/* ---- 2. Scroll reveal ------------------------------------------------- */
	safely(function () {
		var els = document.querySelectorAll(".reveal");
		if (!els.length || !("IntersectionObserver" in window)) return;

		var io = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						io.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.15 },
		);

		// Only now does the CSS hide .reveal elements. If anything above this
		// line failed, the content simply stays visible.
		doc.classList.add("reveal-ready");
		Array.prototype.forEach.call(els, function (el) {
			io.observe(el);
		});
	});

	/* ---- 3. Home page ----------------------------------------------------- */
	safely(function () {
		var hero = document.getElementById("hero");
		if (!hero) return;

		var ZONES = ["hero", "projects", "contact"];
		var sections = ZONES.map(function (id) {
			return document.getElementById(id);
		});
		var stops = document.querySelectorAll(".gauge-stop");
		var track = document.querySelector(".gauge-track");
		var readout = document.querySelector(".gauge-readout");

		function isTarget(id) {
			return id === "top" || ZONES.indexOf(id) !== -1;
		}

		function pageTop(el) {
			return el.getBoundingClientRect().top + window.scrollY;
		}

		/* Where to scroll so a zone's depth line (the line at the bottom of the
		   section) sits exactly on the bottom edge of the screen. Zones are one
		   screen tall, so the previous zone's line is then just off the top.
		   If a zone is taller than the screen (small windows, phones), its
		   heading sits just under the header instead, so the top is never cut off. */
		function targetFor(id) {
			if (id === "top" || id === "hero") return 0;
			var section = document.getElementById(id);
			var header = document.querySelector(".site-header");
			var headerH = header ? header.offsetHeight : 61;
			var maxY = doc.scrollHeight - window.innerHeight;

			var bottom = section.getBoundingClientRect().bottom + window.scrollY;
			var label = section.querySelector(".section-label") || section;
			var labelTop = pageTop(label);

			var toLine = id === "contact" ? maxY : bottom - window.innerHeight;
			var toHeading = labelTop - headerH - 24;
			return Math.max(0, Math.min(toLine, toHeading, maxY));
		}

		document.addEventListener("click", function (e) {
			if (e.defaultPrevented || e.button !== 0) return;
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			var link = e.target.closest && e.target.closest('a[href^="#"]');
			if (!link) return;
			var id = link.getAttribute("href").slice(1);
			if (!isTarget(id)) return;

			e.preventDefault();
			window.scrollTo({
				top: targetFor(id),
				behavior: reduceMotion ? "auto" : "smooth",
			});
			if (history.replaceState) history.replaceState(null, "", "#" + id);
		});

		// Arriving from another page (e.g. About's "Contact" link): land in the
		// same place a nav click would.
		var hash = window.location.hash.slice(1);
		if (hash && isTarget(hash)) {
			var jump = function () {
				window.scrollTo(0, targetFor(hash));
			};
			if (document.fonts && document.fonts.ready) {
				document.fonts.ready.then(jump);
			}
			window.addEventListener("load", jump);
		}

		/* Approximate depth in metres at the middle of the screen: 0 m at the
		   surface, 200 m at the bottom of Projects, 1000 m at the bottom of the
		   page. */
		function depthAt(center) {
			var projectsTop = pageTop(sections[1]);
			var contactTop = pageTop(sections[2]);
			var end = doc.scrollHeight - window.innerHeight / 2;
			var d;
			if (center <= projectsTop) d = 0;
			else if (center <= contactTop) {
				d = (200 * (center - projectsTop)) / (contactTop - projectsTop);
			} else {
				d = 200 + (800 * (center - contactTop)) / Math.max(end - contactTop, 1);
			}
			return Math.round(Math.min(Math.max(d, 0), 1000) / 5) * 5;
		}

		onScrollFrame(function () {
			var maxY = doc.scrollHeight - window.innerHeight;
			var progress = maxY > 0 ? window.scrollY / maxY : 0;
			progress = Math.min(Math.max(progress, 0), 1);

			// Depth veil (the darkening vignette) and the gauge
			doc.style.setProperty("--depth", progress.toFixed(3));
			if (track) track.style.setProperty("--p", progress.toFixed(4));
			if (readout) {
				readout.textContent =
					depthAt(window.scrollY + window.innerHeight / 2) + " m";
			}

			// The active zone is whichever one contains the middle of the screen.
			var probe = window.scrollY + window.innerHeight * 0.5;
			var active = ZONES[0];
			sections.forEach(function (s) {
				if (pageTop(s) <= probe) active = s.id;
			});
			if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
				active = "contact";
			}
			Array.prototype.forEach.call(stops, function (stop) {
				stop.classList.toggle("is-active", stop.dataset.target === active);
			});
		});

		// Pause the hero's animations (waves, boat, moon) while it's off-screen
		if ("IntersectionObserver" in window) {
			new IntersectionObserver(function (entries) {
				hero.classList.toggle("is-paused", !entries[0].isIntersecting);
			}).observe(hero);
		}
	});

	/* ---- 4. Document pages ------------------------------------------------ */
	safely(function () {
		var ticks = document.querySelectorAll(".doc-tick");
		if (ticks.length) {
			var sections = Array.prototype.map
				.call(ticks, function (tick) {
					return document.getElementById(tick.dataset.target);
				})
				.filter(Boolean);

			onScrollFrame(function () {
				var active = sections[0].id;
				sections.forEach(function (s) {
					if (s.getBoundingClientRect().top <= 200) active = s.id;
				});
				if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
					active = sections[sections.length - 1].id;
				}
				Array.prototype.forEach.call(ticks, function (tick) {
					tick.classList.toggle("is-active", tick.dataset.target === active);
				});
			});
		}

		// Demo video: if the file isn't there yet, show the placeholder instead.
		// The failed-source error can fire before this script runs, so check the
		// video's state directly as well as listening for errors.
		var demo = document.querySelector(".demo");
		if (demo) {
			var video = demo.querySelector("video");
			var check = function () {
				var noSource = video.networkState === 3; // NETWORK_NO_SOURCE
				if (video.error || noSource) demo.classList.add("is-empty");
			};
			if (video) {
				var sources = demo.querySelectorAll("source");
				var last = sources[sources.length - 1];
				if (last) last.addEventListener("error", check);
				video.addEventListener("error", check);
				window.addEventListener("load", check);
				setTimeout(check, 1500);
				check();
			}
		}
	});
})();
