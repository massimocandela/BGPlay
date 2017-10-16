#!/usr/bin/env python

from distutils.core import setup

setup(name='openbmp-mrt',
      version='0.1.0',
      description='OpenBMP MRT',
      author='Tim Evens',
      author_email='tim@openbmp.org',
      url='',
      data_files=[('etc', ['src/etc/openbmp-mrt.yml'])],
      package_dir={'': 'src/site-packages'},
      packages=['openbmp', 'openbmp.parsed'],
      scripts=['src/bin/openbmp-mrt']
     )
