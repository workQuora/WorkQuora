import 'package:flutter/material.dart';

// Shared between home_screen.dart's category grid and dashboard_screen.dart's
// popular-services rail — kept in sync with post_job_screen.dart's own
// (string-only) _categories list.
const kCategories = [
  (label: 'Electrician', icon: Icons.bolt_rounded, image: 'assets/images/categories/electrician.jpg'),
  (label: 'Plumber', icon: Icons.plumbing_rounded, image: 'assets/images/categories/plumber.jpg'),
  (label: 'AC Repair', icon: Icons.ac_unit_rounded, image: 'assets/images/categories/ac_repair.jpg'),
  (label: 'Painter', icon: Icons.format_paint_rounded, image: 'assets/images/categories/painter.jpg'),
  (label: 'Maid', icon: Icons.cleaning_services_rounded, image: 'assets/images/categories/maid.jpg'),
  (label: 'Cook', icon: Icons.restaurant_rounded, image: 'assets/images/categories/cook.jpg'),
  (label: 'Mechanic', icon: Icons.build_rounded, image: 'assets/images/categories/mechanic.jpg'),
];
